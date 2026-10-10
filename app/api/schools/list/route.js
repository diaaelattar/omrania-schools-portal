import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = supabaseAdmin();
  if (supabase.isPlaceholder) {
    return NextResponse.json({ schools: [] });
  }

  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, code, name, type, username')
    .order('code', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schools: schools || [] });
}
