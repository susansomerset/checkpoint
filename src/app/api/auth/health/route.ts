// Diagnostic endpoint to check Auth0 configuration
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const requiredVars = [
    'AUTH0_SECRET',
    'AUTH0_DOMAIN', 
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_BASE_URL'
  ];
  
  const present: string[] = [];
  const missing: string[] = [];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  return NextResponse.json({
    status: missing.length === 0 ? 'ok' : 'missing_vars',
    present,
    missing,
    note: missing.length > 0 
      ? 'Add missing variables in Vercel Settings → Environment Variables'
      : 'All required Auth0 environment variables are set'
  });
}

