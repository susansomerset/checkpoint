export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { performStudentDataReset } from '@/lib/student/reset';

/**
 * Cron endpoint for scheduled student data resets
 * This runs the full reset pipeline including augmentation
 * Set up in Vercel cron jobs or external scheduler
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  // Simple auth check - in production, use a secure token
  const expectedToken = process.env.CRON_SECRET || 'dev-secret-token';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call shared reset function
    const result = await performStudentDataReset();
    
    console.info(`ZXQ cron.complete: ok=${result.ok}, step=${result.step || 'success'}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('ZXQ cron.error:', error);
    return NextResponse.json({
      ok: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Also support POST for flexibility
export const POST = GET;

