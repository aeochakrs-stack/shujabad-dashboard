import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const { currentPassword, newPassword } = await request.json();

  // Get user info from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const usernameMatch = cookieHeader.match(/(?:^| )username=([^;]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  if (!username) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Prevent modifying the hardcoded fallback accounts
  if (['admin', 'developer', 'aeo_test'].includes(username)) {
      return NextResponse.json({ error: 'Cannot change password of hardcoded fallback accounts. Please create a real account.' }, { status: 403 });
  }

  if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
  }

  // Verify current password
  const { data: user, error: verifyError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', currentPassword)
    .single();

  if (verifyError || !user) {
    return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
  }

  // Update to new password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newPassword })
    .eq('username', username);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
