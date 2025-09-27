const isMain = process.env.GIT_BRANCH === 'main' || process.env.VERCEL_GIT_COMMIT_REF === 'main';
if (!isMain) process.exit(0);
const fs = require('fs');
const hasSmoke = fs.existsSync('app/api/kv-smoke/route.ts') || fs.existsSync('src/app/api/kv-smoke/route.ts');
if (hasSmoke) {
  console.error('Refusing to build on main with /api/kv-smoke present.');
  process.exit(1);
}


