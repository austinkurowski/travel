import { NextResponse } from 'next/server';
import { getTransit } from '@/lib/transit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const payload = await getTransit();
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
