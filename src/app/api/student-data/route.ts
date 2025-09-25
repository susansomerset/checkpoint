import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';
import { StudentDataSchema } from '@/lib/student/schema';
import * as kv from '@/lib/storage/kv';

export async function GET(req: NextRequest) {
  await requireSession(req);
  
      // Try to get student data from storage
      try {
        const studentData = await kv.get('studentData:v1');
        console.info(`ZXQ get.storage.raw: ${studentData ? 'FOUND' : 'NOT_FOUND'} - ${studentData ? studentData.length : 0} bytes`);
        if (studentData) {
          const parsed = JSON.parse(studentData);
          console.info(`ZXQ get.storage: ${parsed.students ? Object.keys(parsed.students).length : 0} students, ${studentData.length} bytes`);
          return Response.json(parsed);
        }
      } catch (error) {
        console.log('No student data found, falling back to regular data');
      }
  
  // Fall back to regular data
  console.info(`ZXQ get.fallback: Using loadStudentData()`);
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

