import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  // Set cookie server-side so proxy can read it
  const response = NextResponse.json({ success: true, role: data.role });
  response.cookies.set('auth_session', String(data.id), {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
    httpOnly: false, // needs to be readable client-side for role check
  });
  response.cookies.set('user_role', data.role, {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}
