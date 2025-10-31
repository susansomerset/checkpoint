// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Create auth handler function with login configuration  
const authHandler = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});

// Wrap handler to await params (Next.js 15+ requirement)
// The SDK expects synchronous params, so we await and pass resolved params
export async function GET(
  req: Request,
  context: { params: Promise<{ auth0: string }> }
) {
  // Await params to satisfy Next.js 15+ requirement
  const params = await context.params;
  // Call handler with resolved params - SDK expects synchronous params
  return authHandler(req, { params });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ auth0: string }> }
) {
  // Await params to satisfy Next.js 15+ requirement
  const params = await context.params;
  // Call handler with resolved params - SDK expects synchronous params
  return authHandler(req, { params });
}

// Important: force Node runtime & dynamic; Auth0 SDK does not support Edge here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
