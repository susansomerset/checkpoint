import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';

export async function POST(req: NextRequest) {
  await requireSession(req);
  const current = await loadStudentData();
  if (!current) {
    return Response.json({ error: 'No student data found' }, { status: 404 });
  }
  // TODO: Implement Canvas deltas fetching
  await saveStudentData(current);
  return Response.json({ ok: true });
}
