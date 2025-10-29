// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

// For Vercel: don't specify domain in cookies - let browser handle it
// Ensure AUTH0_BASE_URL env var is set to your Vercel deployment URL
export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: (req) => {
      // Check if prompt=login is in query params (from Clear Cookies button)
      const url = new URL(req.url || '', 'http://localhost');
      const prompt = url.searchParams.get('prompt');
      if (prompt === 'login') {
        // Force re-authentication prompt - shows login screen instead of SSO
        return { prompt: 'login' };
      }
      // Default: allow remember me/sso
      return {};
    },
    returnTo: '/dashboard'
  }),
  logout: handleLogout({
    returnTo: '/'
  })
});

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
