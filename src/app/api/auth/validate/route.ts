import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        valid: false, 
        error: 'No session found' 
      }, { status: 401 });
    }

    // The session exists, but we should validate it's still valid
    // Auth0 sessions are typically valid until they expire
    // If the user was deleted, the session should become invalid on next refresh
    
    return NextResponse.json({ 
      valid: true, 
      user: {
        id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture
      }
    });
  } catch {
    return NextResponse.json({ 
      valid: false, 
      error: 'Session validation failed' 
    }, { status: 401 });
  }
}
