import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    // ❌ Removed '/api/student-data/:path*' - protect APIs in-route instead
  ],
};