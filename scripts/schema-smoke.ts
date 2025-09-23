import { StudentDataSchema } from '../src/lib/student/schema';
import { MetaDataSchema } from '../src/lib/meta/schema';

function ok(label: string) { console.info(`OK: ${label}`); }

async function main() {
  // minimal valid studentData (two empty students)
  const studentData = {
    students: {
      s1: { studentId: 's1', meta: {}, courses: {} },
      s2: { studentId: 's2', meta: {}, courses: {} },
    },
  };

  // minimal valid metaData
  const metaData = {
    students: { s1: { preferredName: 'Zach' }, s2: { preferredName: 'Ava' } },
    courses: {},
    autoRefresh: { dailyFullAtMidnightPT: false, quickEveryMinutes: 0 },
  };

  // Parse should succeed
  StudentDataSchema.parse(studentData); ok('StudentData parses');
  MetaDataSchema.parse(metaData); ok('MetaData parses');

  // A couple of negative tests
  let failed = false;
  try {
    StudentDataSchema.parse({ students: { bad: { meta: {}, courses: {} } } }); // missing studentId
  } catch { ok('Invalid StudentData rejected'); failed = true; }

  try {
    MetaDataSchema.parse({ students: {}, courses: {}, autoRefresh: { quickEveryMinutes: 999 } });
  } catch { ok('Invalid MetaData rejected'); failed = true; }

  if (!failed) console.info('OK: Negative tests behaved as expected');
}

main().catch((e) => { console.error(e); process.exit(1); });

