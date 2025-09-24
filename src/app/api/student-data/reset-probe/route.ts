export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    ok: true,
    runtime: process.env.NEXT_RUNTIME ?? 'unknown',
    node: process.versions.node,
  });
}
