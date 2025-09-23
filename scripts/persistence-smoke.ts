// Load .env.local file FIRST
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getStudentData, getMetaData, setMetaData, getLastLoadedAt, saveStudentDataAtomically } from '../src/lib/storage/persistence';

async function main() {
  const draft = { students: { s1: { studentId: 's1', meta: {}, courses: {} } } } as any;
  await saveStudentDataAtomically(draft);
  await setMetaData({ students: {}, courses: {}, autoRefresh: { dailyFullAtMidnightPT: false, quickEveryMinutes: 0 } });

  const student = await getStudentData();
  const meta = await getMetaData();
  const last = await getLastLoadedAt();

  if (!student?.students?.s1) throw new Error('studentData missing s1');
  if (!meta) throw new Error('metaData missing');
  if (!last) throw new Error('lastLoadedAt missing');

  console.info('OK: persistence smoke passed', { lastLoadedAt: last });
}
main().catch((e) => { console.error(e); process.exit(1); });
