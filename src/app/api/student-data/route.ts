import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';
import { StudentDataSchema } from '@/lib/student/schema';
import * as kv from '@/lib/storage/kv';

export async function GET(req: NextRequest) {
  await requireSession(req);
  
  // Try to get test data first
  try {
    const testData = await kv.get('test-student-data');
    if (testData) {
      return Response.json(JSON.parse(testData));
    }
  } catch (error) {
    console.log('No test data found, falling back to regular data');
  }
  
  // Fall back to regular data
  const data = await loadStudentData();
  return Response.json(data ?? { students: [] });
}

export async function PUT(req: NextRequest) {
  await requireSession(req);
  const body = await req.json();
  const parsed = StudentDataSchema.parse(body);
  await saveStudentData(parsed);
  return Response.json({ ok: true });
}

