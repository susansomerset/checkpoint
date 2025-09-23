import { requireSession } from '@/lib/auth/auth0';
import { saveStudentData } from '@/lib/storage';
import { makeFreshStudentData } from '@/lib/student/transform';

export async function POST() {
  await requireSession();
  const fresh = makeFreshStudentData();
  await saveStudentData(fresh);
  return Response.json({ ok: true });
}

