import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData, kv } from '@/lib/storage';
import { StudentDataSchema } from '@/lib/contracts/types';
import { k } from '@/lib/storage/prefix';

export async function GET(req: NextRequest) {
  try {
    await requireSession(req);
  } catch {
    console.info('ZXQ auth.required: No session found');
    return Response.json(
      { error: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }
  
      // Try to get student data from storage
      try {
        const studentData = await kv.get(k('studentData:v1'));
        console.info(`ZXQ get.storage.raw: ${studentData ? 'FOUND' : 'NOT_FOUND'} - ${studentData ? studentData.length : 0} bytes`);
        if (studentData) {
          try {
            const parsed = JSON.parse(studentData);
            console.info(`ZXQ get.storage: ${parsed.students ? Object.keys(parsed.students).length : 0} students, ${studentData.length} bytes`);
            return Response.json({
              ok: true,
              status: 200,
              data: parsed
            });
          } catch (parseError) {
            console.error('ZXQ JSON parse error:', parseError);
            console.error('ZXQ Raw data preview:', studentData.substring(0, 200));
            // Fall through to regular data
          }
        }
      } catch (storageError) {
        console.error('ZXQ Storage error:', storageError);
        console.info('No student data found, falling back to regular data');
      }
  
  // Fall back to regular data
  console.info(`ZXQ get.fallback: Using loadStudentData()`);
  const data = await loadStudentData();
  return Response.json({
    ok: true,
    status: 200,
    data: data ?? { students: [] }
  });
}

export async function PUT(req: NextRequest) {
  await requireSession(req);
  const body = await req.json();
  const parsed = StudentDataSchema.parse(body);
  await saveStudentData(parsed);
  return Response.json({ ok: true });
}

