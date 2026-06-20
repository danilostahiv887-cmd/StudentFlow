import { NextResponse } from 'next/server';
import { getSupabaseWakeStatus } from '@/server/supabase-wake';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const status = await getSupabaseWakeStatus({ restoreIfPaused: true });
  const httpStatus = status.state === 'ready' ? 200 : status.state === 'unconfigured' ? 501 : 202;
  return NextResponse.json(status, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
