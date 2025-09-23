import { getStudentData, getMetaData, setMetaData, getLastLoadedAt, saveStudentDataAtomically } from '@/lib/storage/persistence';

function smokeEnabled(req: Request) {
  // Enable in dev automatically, or in any env if SMOKE_ROUTES=1 AND a shared secret is sent.
  const onDev = process.env.NODE_ENV === 'development';
  const flag = process.env.SMOKE_ROUTES === '1';
  const url = new URL(req.url);
  const token = url.searchParams.get('smokeToken') || req.headers.get('x-smoke-token');
  const okToken = process.env.SMOKE_TOKEN && token === process.env.SMOKE_TOKEN;
  return onDev || (flag && okToken);
}

export async function GET(req: Request) {
  if (!smokeEnabled(req)) {
    return new Response('Not Found', { status: 404 });
  }

  // Minimal valid doc (Step 1 schema should accept this)
  const draft = { students: { s1: { studentId: 's1', meta: {}, courses: {} } } };
  await saveStudentDataAtomically(draft as import('@/lib/student/schema').StudentData);

  // Prove metaData is independent
  await setMetaData({ smoke: true, t: Date.now() });

  const student = await getStudentData();
  const meta = await getMetaData();
  const lastLoadedAt = await getLastLoadedAt();

  return Response.json({ ok: true, student, meta, lastLoadedAt });
}

