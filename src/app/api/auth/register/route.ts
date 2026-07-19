import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  // Get role from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const roleMatch = cookieHeader.match(/(?:^| )user_role=([^;]+)/);
  const role = roleMatch ? roleMatch[1] : null;

  if (role !== 'admin' && role !== 'developer') {
    return NextResponse.json({ error: 'Only Administrators can create new accounts.' }, { status: 403 });
  }

  // Insert into DB. The schema defaults the role to 'aeo'.
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password_hash: password }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create account. ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}
