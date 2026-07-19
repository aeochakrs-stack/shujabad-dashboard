import { NextResponse } from 'next/server';

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = NextResponse.redirect(new URL('/login', appUrl));
  response.cookies.set('auth_session', '', {
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
  });
  response.cookies.set('user_role', '', {
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
  });
  return response;
}
