import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/storage';
import { k } from '@/lib/storage/prefix';

export async function GET() {
  try {
    console.info('ZXQ metadata GET: Starting...');
    const data = await kv.get(k('metadata:v1'));
    console.info('ZXQ metadata GET: Retrieved data type:', typeof data);
    console.info('ZXQ metadata GET: Retrieved data value:', data);
    
    if (data) {
      // Check if data is the string "[object Object]" which means it's not properly stored
      if (data === '[object Object]') {
        console.info('ZXQ metadata GET: Data is corrupted "[object Object]", returning empty structure');
        return NextResponse.json({ courses: {}, students: {} });
      }
      
      // Try to parse if it's a string, otherwise use as-is
      let parsed;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch {
          console.info('ZXQ metadata GET: JSON parse failed, treating as corrupted data');
          return NextResponse.json({ courses: {}, students: {} });
        }
      } else {
        parsed = data; // Already an object
      }
      console.info('ZXQ metadata GET: Parsed successfully, keys:', Object.keys(parsed));
      return NextResponse.json(parsed);
    } else {
      console.info('ZXQ metadata GET: No data found, returning empty structure');
      return NextResponse.json({ courses: {}, students: {} });
    }
  } catch (error) {
    console.error('ZXQ metadata GET error:', error);
    return NextResponse.json({ error: 'Failed to load metadata', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const metadata = await req.json();
    console.info('ZXQ metadata POST: Received metadata keys:', Object.keys(metadata));
    await kv.set(k('metadata:v1'), JSON.stringify(metadata));
    console.info('ZXQ metadata POST: Saved to Redis successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ZXQ metadata POST error:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}
