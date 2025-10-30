import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';

export default withMiddlewareAuthRequired(async function middleware() {
  // Middleware is only called for matched routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    // ❌ Removed '/api/student-data/:path*' - protect APIs in-route instead
    // ❌ Never protect '/api/auth/:path*' - Auth0 SDK handles those
  ],
};