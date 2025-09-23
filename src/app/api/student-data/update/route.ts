import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';
import { fetchCanvasDeltas } from '@/lib/canvas/activity';
import { applyDeltas, recomputeStatuses } from '@/lib/student/transform';

export async function POST() {
  await requireSession();
  const current = (await loadStudentData()) ?? { students: {} };
  const deltas = await fetchCanvasDeltas();
  const merged = recomputeStatuses(applyDeltas(current, deltas));
  await saveStudentData(merged);
  return Response.json({ ok: true });
}
