import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ emis: string }> }
) {
  try {
    const resolvedParams = await params;
    const emisCode = resolvedParams.emis;

    const res = await fetch(`https://sis.pesrp.edu.pk/dashboard/rationalization_posts_tab?district_id=22&tehsil_id=118&markaz_id=&school_id=&s_id_emis_code=${emisCode}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 } // Cache for 1 hour to prevent spamming SIS
    });
    
    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch from SIS' }, { status: 500 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const teachers: any[] = [];

    // Find the Teacher Assignment table
    $('table.sanctioned_post tbody tr').each((i, el) => {
        if ($(el).hasClass('total')) return; // Skip total row
        
        const teacherCell = $(el).find('td').eq(6); // The 7th column has the teachers
        if (teacherCell.length > 0) {
            // SIS puts multiple teachers in the same cell, separated by <br> and <span>
            teacherCell.find('span').each((j, span) => {
                const text = $(span).text().trim();
                // Format is usually: **********682 / Zahida Perveen / PST (Arts) /
                // Or sometimes it has additional classes like (School Head - Lookafter Charge)
                if (text.includes('**********') && text.includes('/')) {
                    const parts = text.split('/').map(p => p.trim()).filter(p => p);
                    if (parts.length >= 3) {
                        teachers.push({
                            cnic_masked: parts[0],
                            name: parts[1],
                            designation: parts[2]
                        });
                    }
                }
            });
        }
    });

    return NextResponse.json({ teachers });

  } catch (error) {
    console.error('SIS Teachers Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
