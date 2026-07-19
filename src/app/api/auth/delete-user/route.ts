import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(request: Request) {
  // Get role from cookie to ensure only admins can delete
  const cookieHeader = request.headers.get('cookie') || '';
  const roleMatch = cookieHeader.match(/(?:^| )user_role=([^;]+)/);
  const role = roleMatch ? roleMatch[1] : null;

  if (role !== 'admin' && role !== 'developer') {
    return NextResponse.json({ error: 'Only Administrators can delete accounts.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Prevent deleting developer accounts as an extra safety measure
  const { data: userToKill } = await supabase.from('users').select('role').eq('id', userId).single();
  
  if (userToKill?.role === 'developer') {
      return NextResponse.json({ error: 'Cannot delete developer accounts.' }, { status: 403 });
  }

  // Delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete user: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
