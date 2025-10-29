// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

// For Vercel with custom domains, configure cookies properly
// Ensure AUTH0_BASE_URL env var is set to your Vercel deployment URL
// Note: prompt=login parameter in URL will be automatically passed to Auth0
export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
    // prompt=login from URL query params will be forwarded to Auth0 automatically
  }),
  logout: handleLogout({
    returnTo: '/'
  }),
  // Configure cookie settings to ensure they're sent with requests
  // Don't set domain - let browser handle it for subdomain cookies
  // SameSite=None with Secure=true for cross-site requests (if needed)
  // But for same-site, SameSite=Lax should work
});

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
