import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ auth0: string }> }) {
  const { auth0: route } = await params;
  
  switch (route) {
    case 'login':
      return handleLogin(req);
    case 'logout':
      return handleLogout(req);
    case 'callback':
      return handleCallback(req);
    case 'profile':
      return handleProfile(req);
    default:
      return new Response('Not Found', { status: 404 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ auth0: string }> }) {
  const { auth0: route } = await params;
  
  if (route === 'callback') {
    return handleCallback(req);
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

function handleLogin(_req: NextRequest) {
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  
  if (!domain || !clientId) {
    return NextResponse.json({ error: 'Auth0 not configured' }, { status: 400 });
  }
  
  const loginUrl = new URL(`https://${domain}/authorize`);
  loginUrl.searchParams.set('client_id', clientId);
  loginUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/callback`);
  loginUrl.searchParams.set('response_type', 'code');
  loginUrl.searchParams.set('scope', 'openid profile email');
  loginUrl.searchParams.set('state', 'dummy-state');
  
  return NextResponse.redirect(loginUrl.toString());
}

function handleLogout(_req: NextRequest) {
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  
  if (!domain || !clientId) {
    return NextResponse.json({ error: 'Auth0 not configured' }, { status: 400 });
  }
  
  const logoutUrl = new URL(`https://${domain}/v2/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('returnTo', baseUrl);
  
  return NextResponse.redirect(logoutUrl.toString());
}

function handleCallback(_req: NextRequest) {
  // For now, just redirect to dashboard
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}

function handleProfile(_req: NextRequest) {
  // For now, return null user
  return NextResponse.json({ user: null });
}
