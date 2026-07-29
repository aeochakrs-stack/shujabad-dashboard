const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'https://gqtwplrtpajiittpprvj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCoordinates(emisCode) {
    const url = `https://sis.pesrp.edu.pk/dashboard/rationalization_posts_tab?district_id=22&tehsil_id=118&markaz_id=&school_id=&s_id_emis_code=${emisCode}`;
    try {
        const response = await fetch(url, {
            headers: {
                "accept": "text/html, */*; q=0.01",
                "Referer": "https://sis.pesrp.edu.pk/dashboard",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        
        if (!response.ok) return null;
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        let latitude = null;
        let longitude = null;
        let level = null;
        let posts = [];
        let liveTeachers = [];
        
        // Find the map link inside the HTML
        const mapLink = $('a[href*="show_google_map_school"]').attr('href');
        
        // Find the school level (it's in the second column of the first row of the table)
        // <tr><td>Name</td><td>Level</td>...
        const levelText = $('table tbody tr:first-child td:nth-child(2)').text().trim();
        if (levelText) {
            if (levelText.includes('Primary')) level = 'Primary';
            else if (levelText.includes('Middle')) level = 'Middle';
            else if (levelText.includes('High')) level = 'High';
            else if (levelText.includes('Higher Secondary')) level = 'Higher Secondary';
        }
        
        if (mapLink) {
            // Now fetch the map link to get the redirect URL which contains coordinates
            const mapRes = await fetch(mapLink, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });
            const mapHtml = await mapRes.text();
            
            // The map HTML contains <link href="/maps/preview/directions?...%213d29.83819127082825%214d71.29150629043579..."
            const match3d = mapHtml.match(/3d([0-9]+\.[0-9]+)/);
            const match4d = mapHtml.match(/4d([0-9]+\.[0-9]+)/);
            
            if (match3d && match4d) {
                latitude = parseFloat(match3d[1]);
                longitude = parseFloat(match4d[1]);
            }
        }
        
        // Find Teacher Assignment Posts
        $('table').filter((_, tbl) => $(tbl).find('th').text().includes('Assigned Teacher')).find('tbody tr').each((_, el) => {
            if ($(el).hasClass('total')) return;
            const cells = $(el).find('td');
            if (cells.length < 6) return;
            const designation = $(cells[1]).text().trim();
            const sanctioned = parseInt($(cells[2]).text().trim()) || 0;
            const filled = parseInt($(cells[3]).text().trim()) || 0;
            const vacant = parseInt($(cells[4]).text().trim()) || 0;
            if (designation) {
                posts.push({ emis_code: emisCode, designation, sanctioned, filled, vacant });
            }
            
            const assignedText = $(cells[5]).text().trim();
            if (assignedText) {
                const parts = assignedText.split('**********').filter(Boolean);
                for (const p of parts) {
                    const segments = p.split(' / ');
                    if (segments.length >= 3) {
                        const name = segments[1].trim();
                        const desig = segments[2].trim().replace(/\/+$/, '').trim();
                        liveTeachers.push({
                            teacher_name: name,
                            designation: desig,
                            emis_code: emisCode,
                            status: 'Active',
                            missing_from_sis: false
                        });
                    }
                }
            }
        });
        
        return { latitude, longitude, level, posts, liveTeachers };
    } catch (e) {
        console.error(`Error fetching coords for ${emisCode}:`, e.message);
        return null;
    }
}

async function main() {
    console.log("Starting Nightly Sync for All Schools...");
    
    // Fetch all schools from Supabase
    const { data: schools, error } = await supabase.from('schools').select('emis_code, latitude');
    
    if (error || !schools) {
        console.error("Failed to fetch schools from Supabase:", error);
        process.exit(1);
    }
    
    console.log(`Found ${schools.length} schools in database.`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < schools.length; i++) {
        const school = schools[i];
        
        console.log(`[${i+1}/${schools.length}] Fetching data for ${school.emis_code}...`);
        const coords = await fetchCoordinates(school.emis_code);
        
        if (coords) {
            const updatePayload = {};
            if (coords.latitude && coords.longitude) {
                console.log(`  -> Found Coordinates: ${coords.latitude}, ${coords.longitude}`);
                updatePayload.latitude = coords.latitude;
                updatePayload.longitude = coords.longitude;
            }
            if (coords.level) {
                console.log(`  -> Found Level: ${coords.level}`);
                updatePayload.level = coords.level;
            }
            
            if (Object.keys(updatePayload).length > 0) {
                const { error: updateError } = await supabase
                    .from('schools')
                    .update(updatePayload)
                    .eq('emis_code', school.emis_code);
                    
                if (updateError) {
                    console.error(`  -> Failed to update Supabase for ${school.emis_code}:`, updateError.message);
                } else {
                    updatedCount++;
                }
            } else {
                console.log(`  -> No coordinates or level found.`);
            }

            if (coords.posts && coords.posts.length > 0) {
                console.log(`  -> Found ${coords.posts.length} teacher assignment posts.`);
                const { error: postError } = await supabase.from('sanctioned_posts').upsert(coords.posts, { onConflict: 'emis_code, designation' });
                if (postError) {
                    console.error(`  -> Failed to update posts for ${school.emis_code}:`, postError.message);
                }
            }
            
            if (coords.liveTeachers && coords.liveTeachers.length > 0) {
                console.log(`  -> Found ${coords.liveTeachers.length} active teachers on SIS.`);
                
                // Fetch existing staff for this school
                const { data: existingStaff } = await supabase.from('hrmis_staff').select('id, teacher_name').eq('emis_code', school.emis_code);
                
                const existingNames = new Set((existingStaff || []).map(s => s.teacher_name.toLowerCase()));
                const liveNames = new Set(coords.liveTeachers.map(t => t.teacher_name.toLowerCase()));
                
                // 1. Mark missing as Transferred
                const missingStaffIds = (existingStaff || [])
                   .filter(s => !liveNames.has(s.teacher_name.toLowerCase()))
                   .map(s => s.id);
                   
                if (missingStaffIds.length > 0) {
                   await supabase.from('hrmis_staff').update({ status: 'Transferred', missing_from_sis: true }).in('id', missingStaffIds);
                   console.log(`  -> Marked ${missingStaffIds.length} teachers as Transferred/Missing.`);
                }
                
                // 2. Insert new teachers (like SSTs)
                const newTeachers = coords.liveTeachers
                   .filter(t => !existingNames.has(t.teacher_name.toLowerCase()))
                   .map(t => ({ ...t, id: 'SIS-' + Math.random().toString(36).substr(2, 9) }));
                
                if (newTeachers.length > 0) {
                   const { error: insError } = await supabase.from('hrmis_staff').insert(newTeachers);
                   if (insError) console.error("Error inserting teachers:", insError);
                   else console.log(`  -> Inserted ${newTeachers.length} new teachers from SIS.`);
                }
                
                // 3. Ensure existing live teachers are Active
                const activeStaffIds = (existingStaff || [])
                   .filter(s => liveNames.has(s.teacher_name.toLowerCase()))
                   .map(s => s.id);
                   
                if (activeStaffIds.length > 0) {
                   await supabase.from('hrmis_staff').update({ status: 'Active', missing_from_sis: false }).in('id', activeStaffIds);
                }
            }
        }
        
        // Be nice to the SIS server
        await delay(500);
    }
    
    console.log(`Sync Complete! Updated coordinates for ${updatedCount} schools.`);
}

main();
