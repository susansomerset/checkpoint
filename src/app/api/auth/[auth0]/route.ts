import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// App Router needs a named handler. This covers all /api/auth/*.
export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});
export const POST = GET;
