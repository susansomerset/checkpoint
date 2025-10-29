export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { performStudentDataReset } from '@/lib/student/reset';

export async function POST(req: NextRequest) {
  // Session check
  const res = new NextResponse();
  const session = await getSession(req, res);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Call shared reset function
  const result = await performStudentDataReset();
  
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  
  return NextResponse.json(result);
}