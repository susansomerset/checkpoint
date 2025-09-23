import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/student-data/:path*',
  ],
};