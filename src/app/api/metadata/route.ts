import { NextRequest, NextResponse } from 'next/server';
import { set, get } from '@/lib/storage/kv';

export async function GET() {
  try {
    console.log('ZXQ metadata GET: Starting...');
    const data = await get('metadata:v1');
    console.log('ZXQ metadata GET: Retrieved data type:', typeof data);
    console.log('ZXQ metadata GET: Retrieved data value:', data);
    
    if (data) {
      // Check if data is the string "[object Object]" which means it's not properly stored
      if (data === '[object Object]') {
        console.log('ZXQ metadata GET: Data is corrupted "[object Object]", returning empty structure');
        return NextResponse.json({ courses: {}, students: {} });
      }
      
      // Try to parse if it's a string, otherwise use as-is
      let parsed;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch (parseError) {
          console.log('ZXQ metadata GET: JSON parse failed, treating as corrupted data');
          return NextResponse.json({ courses: {}, students: {} });
        }
      } else {
        parsed = data; // Already an object
      }
      console.log('ZXQ metadata GET: Parsed successfully, keys:', Object.keys(parsed));
      return NextResponse.json(parsed);
    } else {
      console.log('ZXQ metadata GET: No data found, returning empty structure');
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
    console.log('ZXQ metadata POST: Received metadata keys:', Object.keys(metadata));
    await set('metadata:v1', JSON.stringify(metadata));
    console.log('ZXQ metadata POST: Saved to Redis successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ZXQ metadata POST error:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}
