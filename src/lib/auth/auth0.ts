import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function requireSession(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);
  if (!session) {
    // Avoid logging secrets; respond with 401 at route layer
    throw new Error('AUTH_REQUIRED');
  }
  return { session, res };
}
