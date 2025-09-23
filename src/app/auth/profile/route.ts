import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  // For now, return null user
  return NextResponse.json({ user: null });
}
