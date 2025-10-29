// app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';

// For Vercel: don't specify domain in cookies - let browser handle it
// Ensure AUTH0_BASE_URL env var is set to your Vercel deployment URL
export const GET = handleAuth();

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
