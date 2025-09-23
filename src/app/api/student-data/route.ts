import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';
import { StudentDataSchema } from '@/lib/student/schema';

export async function GET() {
  await requireSession();
  const data = await loadStudentData();
  return Response.json(data ?? { students: [] });
}

export async function PUT(req: NextRequest) {
  await requireSession();
  const body = await req.json();
  const parsed = StudentDataSchema.parse(body);
  await saveStudentData(parsed);
  return Response.json({ ok: true });
}

