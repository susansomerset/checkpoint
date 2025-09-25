export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    runtime: process.env.NEXT_RUNTIME ?? 'unknown',
    node: process.versions.node,
  });
}
