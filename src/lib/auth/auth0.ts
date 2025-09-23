import { getSession } from '@auth0/nextjs-auth0';

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    // Avoid logging secrets; respond with 401 at route layer
    throw new Error('AUTH_REQUIRED');
  }
  return session;
}
