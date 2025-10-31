// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Create handler with login configuration
// Note: handleAuth() returns a route handler that Next.js will call
// We assign it directly to avoid wrapping issues
const handler = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});

// Export handler directly - Next.js 15 may warn about async params
// but the SDK should handle it internally. If this causes issues,
// we'll need to await params and pass them explicitly.
export const GET = handler;
export const POST = handler;

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
