import { Auth0Client } from '@auth0/nextjs-auth0/server';

const auth0 = new Auth0Client();

export async function requireSession() {
  const session = await auth0.getSession();
  if (!session) {
    // Avoid logging secrets; respond with 401 at route layer
    throw new Error('AUTH_REQUIRED');
  }
  return session;
}
