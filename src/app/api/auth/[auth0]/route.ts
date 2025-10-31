// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

// Create auth handler function with login configuration
const authHandler = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});

// Wrap handler to await params (Next.js 15+ requirement)
// The SDK's handleAuth internally accesses params.auth0 synchronously.
// We await params first to satisfy Next.js 15, then pass awaited params to SDK handler.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Await params to satisfy Next.js 15+ requirement
  const awaitedParams = await params;
  // Call SDK handler with awaited params
  return authHandler(req, { params: awaitedParams });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  // Await params to satisfy Next.js 15+ requirement
  const awaitedParams = await params;
  // Call SDK handler with awaited params
  return authHandler(req, { params: awaitedParams });
}

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
