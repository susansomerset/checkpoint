import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  // Simple token check - you can set this in Vercel env vars
  if (process.env.SMOKE_TOKEN && token !== process.env.SMOKE_TOKEN) {
    return new Response('Not Found', { status: 404 });
  }
  
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || null,
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || null,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? 'SET' : 'NOT_SET',
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    AUTH0_SECRET: process.env.AUTH0_SECRET ? 'SET' : 'NOT_SET',
    VERCEL_URL: process.env.VERCEL_URL || null,
    // Check for any newlines in CLIENT_ID
    CLIENT_ID_HAS_NEWLINE: process.env.AUTH0_CLIENT_ID?.includes('\n') || false,
  });
}