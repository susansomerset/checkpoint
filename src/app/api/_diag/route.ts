export const runtime = 'nodejs';

export async function GET() {
  const present = [
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_SECRET',
  ].reduce((acc, k) => ({ ...acc, [k]: !!process.env[k] }), {});
  return new Response(
    JSON.stringify({
      runtime: 'node',
      nodeVersion: process.versions?.node,
      envPresent: present,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}

