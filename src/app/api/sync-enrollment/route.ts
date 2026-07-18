import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const csvUrl = "https://docs.google.com/spreadsheets/d/1AxmpCZhsQ-rFAJkgYrTbPby6FEG8HHkbL60IStUl-ak/export?format=csv";

// Simple CSV line parser that handles quoted fields
function parseCsvLine(text: string) {
    let ret = [], p = '', inQuote = false;
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (inQuote) {
            if (c === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    p += '"'; i++;
                } else {
                    inQuote = false;
                }
            } else { p += c; }
        } else {
            if (c === '"') { inQuote = true; }
            else if (c === ',') { ret.push(p); p = ''; }
            else { p += c; }
        }
    }
    ret.push(p);
    return ret;
}

export async function GET() {
    try {
        const response = await fetch(csvUrl, { cache: 'no-store' });
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch CSV' }, { status: 500 });
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // Skip header (row 0)
        let updatedCount = 0;
        const updates = [];

        for (let i = 1; i < lines.length; i++) {
            const lineStr = lines[i].trim();
            if (!lineStr) continue;
            
            const row = parseCsvLine(lineStr);
            if (row.length < 18) continue;
            
            const tehsil = row[1];
            // We only care about Shujabad (it's spelled SHUJA ABAD in the CSV)
            if (tehsil && (tehsil.toUpperCase().includes('SHUJABAD') || tehsil.toUpperCase().includes('SHUJA'))) {
                const emisCode = row[5];
                const totalBaseline = parseInt(row[12]) || 0;
                const currentEnrolment = parseInt(row[16]) || 0;
                const targettedEnrolment = parseInt(row[17]) || 0;

                if (emisCode && !isNaN(Number(emisCode))) {
                    updates.push(
                        supabase.from('schools')
                            .update({
                                enrollment_baseline: totalBaseline,
                                enrollment_current: currentEnrolment,
                                enrollment_target: targettedEnrolment
                            })
                            .eq('emis_code', emisCode)
                    );
                    updatedCount++;
                }
            }
        }

        // Wait for all updates to finish (Supabase JS handles up to a certain concurrency fine)
        // For production with thousands, we'd chunk, but Shujabad has ~300 schools
        await Promise.allSettled(updates);

        return NextResponse.json({ success: true, updated: updatedCount });
    } catch (err: any) {
        console.error("Sync error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
