// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export const runtime = 'nodejs'; // ensure Node runtime, not Edge

const handler = handleAuth({
  login: handleLogin({ returnTo: '/dashboard' }),
});

// Export the SDK handler directly — do not wrap or touch params
export const GET = handler;
export const POST = handler;
