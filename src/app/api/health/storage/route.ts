import { NextResponse } from 'next/server';
import { getRaw } from '@/lib/storage/redis-raw';
import { getMetricsSummary } from '@/lib/storage/fallback';
import { k } from '@/lib/storage/prefix';

export async function GET() {
  try {
    const t0 = Date.now();
    
    // Ping Upstash
    await getRaw(k('metadata:v1'));
    const ping = Date.now() - t0;
    
    // Get metrics summary
    const metrics = getMetricsSummary();
    
    // Check if keys are present
    const studentDataV1 = await getRaw(k('studentData:v1'));
    const metadataV1 = await getRaw(k('metadata:v1'));
    
    return NextResponse.json({
      namespace: process.env.UPSTASH_NAMESPACE,
      upstashPingMs: ping,
      metrics: {
        fallbackHits1h: metrics.fallbackHits1h,
        dualWriteErrors1h: metrics.dualWriteErrors1h,
        storageWriteP50: metrics.storageWriteP50,
        storageWriteP95: metrics.storageWriteP95,
      },
      keysPresent: {
        studentDataV1: studentDataV1 !== null,
        metadataV1: metadataV1 !== null,
      },
      flags: {
        USE_KV_FALLBACK: process.env.USE_KV_FALLBACK,
        DUAL_WRITE: process.env.DUAL_WRITE,
        MIGRATION_DRY_RUN: process.env.MIGRATION_DRY_RUN,
      },
    });
  } catch (error) {
    console.error('ZXQ health check failed:', error);
    return NextResponse.json(
      { 
        error: 'Health check failed', 
        details: String(error),
        namespace: process.env.UPSTASH_NAMESPACE,
      },
      { status: 500 }
    );
  }
}
