import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);
  return NextResponse.json({
    ok: !!session,
    sub: session?.user?.sub ?? null,
    email: session?.user?.email ?? null,
    name: session?.user?.name ?? null,
  });
}
