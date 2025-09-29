// app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
