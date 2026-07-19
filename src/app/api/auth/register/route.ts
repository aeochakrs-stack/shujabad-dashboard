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

  // Auto-login the user by setting the cookie
  const response = NextResponse.json({ success: true, role: data.role });
  response.cookies.set('auth_session', String(data.id), { path: '/', maxAge: 86400, sameSite: 'lax', httpOnly: false });
  response.cookies.set('user_role', data.role, { path: '/', maxAge: 86400, sameSite: 'lax', httpOnly: false });
  response.cookies.set('username', data.username, { path: '/', maxAge: 86400, sameSite: 'lax', httpOnly: false });

  return response;
}
