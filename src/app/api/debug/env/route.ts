export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (process.env.SMOKE_TOKEN && token !== process.env.SMOKE_TOKEN) {
    return new Response('Not Found', { status: 404 });
  }
  return Response.json({
    NODE_ENV: process.env.NODE_ENV,
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
    // do NOT include secrets
  });
}
