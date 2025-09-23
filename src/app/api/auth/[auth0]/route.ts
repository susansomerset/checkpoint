import { handleAuth } from '@auth0/nextjs-auth0';

// App Router needs a named handler. This covers all /api/auth/*.
export const GET = handleAuth();
export const POST = GET;
