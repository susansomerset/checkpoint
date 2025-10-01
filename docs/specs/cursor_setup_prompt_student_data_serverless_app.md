# Prompt for Chuckles (Cursor) — Configure Project for Serverless StudentData App

> Paste this whole prompt into Cursor and run step‑by‑step. Follow every guardrail exactly. No deviations.

## ROLE & SCOPE
You are Chuckles configuring a **Next.js (App Router) + TypeScript** project deployed to **Vercel**. This app manages a single JSON document called **studentData** (two student objects with courses + metadata) behind authenticated serverless API endpoints. Storage must be **durable** (not in-memory, not local FS). Use **Vercel KV** by default (with easy swap to Blob/S3 or Postgres later via a storage adapter).

**Strict guardrails:**
- Keep output professional; **no compliments**. Do not add chit-chat.
- **No console logging inside loops**. Prefer minimal, meaningful logs.
- Use **camelCase** for variables/functions; **PascalCase** for React components/types if needed.
- No speculative features, no scaffolding unrelated to requirements, no dead code, no demo pages.
- Small, focused modules. Cohesive functions. No unneeded abstractions.
- Every new file must be referenced/imported by something; remove unused code.
- All endpoints must be **Auth0-protected**. Do not ship unsecured routes.
- Treat serverless functions as **stateless**; **never** rely on process memory or project filesystem for persistence.
- Keep dependencies minimal: `@auth0/nextjs-auth0`, `zod`, `@vercel/kv` (or `ioredis` if needed by environment). No other libraries unless required.

## PROJECT LAYOUT
Create exactly these directories/files (omit anything not listed):

```
/app
  /api
    /student-data
      route.ts                 # GET = getStudentData, PUT = setStudentData
    /student-data/reset
      route.ts                 # POST = resetStudentData
    /student-data/update
      route.ts                 # POST = updateStudentData (poll Canvas, merge, save)
  /(app)
    /dashboard
      page.tsx                 # minimal UI to view studentData
    /settings
      page.tsx                 # minimal UI to edit project metadata (non-sensitive)
/lib
  /auth
    auth0.ts                   # session retrieval + requireSession helper
  /canvas
    client.ts                  # tiny fetch wrapper for Canvas
    activity.ts                # delta fetch: activity/submissions helpers
  /student
    schema.ts                  # Zod + TS types for StudentData
    transform.ts               # applyDeltas, recomputeStatuses, makeFreshStudentData
  /storage
    index.ts                   # loadStudentData/saveStudentData; dispatch by env STORAGE_BACKEND
    kv.ts                      # Vercel KV implementation
/middleware.ts                 # Auth0 middleware protecting UI + API routes
/types.ts                      # shared light types if needed (keep minimal)
/.env.example                  # template of env vars (no secrets)
```

## ENVIRONMENT VARIABLES
Create `.env.example` with these keys (no secrets hardcoded):

```
# Auth0
AUTH0_SECRET=
AUTH0_ISSUER_BASE_URL=
AUTH0_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Storage backend selection: kv | blob | postgres (default kv)
STORAGE_BACKEND=kv

# Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY=false

# Canvas
CANVAS_BASE_URL=
CANVAS_TOKEN=
```

## AUTH0 MIDDLEWARE
Implement strict protection for UI + API routes.

**/middleware.ts**
```ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/student-data/:path*',
  ],
};
```

**/lib/auth/auth0.ts**
```ts
import { getSession } from '@auth0/nextjs-auth0';

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    // Avoid logging secrets; respond with 401 at route layer
    throw new Error('AUTH_REQUIRED');
  }
  return session;
}
```

## STORAGE ADAPTER
Single entrypoint with backend switch. Default: **kv**.

**/lib/storage/index.ts**
```ts
import { STORAGE_BACKEND } from '@/types';
import * as kv from './kv';

export type StudentData = { students: any[] };

export async function loadStudentData(): Promise<StudentData | null> {
  switch (process.env.STORAGE_BACKEND || 'kv') {
    case 'kv':
    default:
      return kv.loadStudentData();
  }
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  switch (process.env.STORAGE_BACKEND || 'kv') {
    case 'kv':
    default:
      return kv.saveStudentData(doc);
  }
}
```

**/lib/storage/kv.ts**
```ts
import { kv } from '@vercel/kv';

const KEY = 'studentData:v1';

type StudentData = { students: any[] };

export async function loadStudentData(): Promise<StudentData | null> {
  const raw = await kv.get<string>(KEY);
  return raw ? JSON.parse(raw) as StudentData : null;
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  await kv.set(KEY, JSON.stringify(doc));
}
```

## STUDENT DOMAIN
**/lib/student/schema.ts**
```ts
import { z } from 'zod';

export const AssignmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  dueAt: z.string().optional(),
  status: z.enum(['missing','submitted','graded','late','upcoming']),
  pointsPossible: z.number().optional(),
  score: z.number().optional(),
});

export const CourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  metadata: z.record(z.any()).default({}),
  assignments: z.array(AssignmentSchema).default([]),
});

export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  metadata: z.record(z.any()).default({}),
  courses: z.array(CourseSchema).default([]),
});

export const StudentDataSchema = z.object({
  students: z.array(StudentSchema).default([]),
});

export type Assignment = z.infer<typeof AssignmentSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type StudentData = z.infer<typeof StudentDataSchema>;
```

**/lib/student/transform.ts**
```ts
import { StudentData } from './schema';

export function makeFreshStudentData(): StudentData {
  return {
    students: [
      { id: 's1', name: 'Student One', metadata: {}, courses: [] },
      { id: 's2', name: 'Student Two', metadata: {}, courses: [] },
    ],
  };
}

export function applyDeltas(current: StudentData, deltas: unknown[]): StudentData {
  // TODO: implement merge rules. Keep deterministic, id-based updates only.
  return current;
}

export function recomputeStatuses(doc: StudentData): StudentData {
  // TODO: traverse assignments and recompute status fields.
  return doc;
}
```

## CANVAS CLIENT
**/lib/canvas/client.ts**
```ts
export async function canvasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.CANVAS_BASE_URL;
  const token = process.env.CANVAS_TOKEN;
  if (!base || !token) throw new Error('Canvas env not configured');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Canvas ${res.status}`);
  return res.json();
}
```

**/lib/canvas/activity.ts**
```ts
import { canvasFetch } from './client';

export async function fetchActivityStream(perPage = 50) {
  return canvasFetch(`/api/v1/users/self/activity_stream?per_page=${perPage}`);
}

export async function fetchSubmissionsSince(courseId: string, params: { submittedSince?: string; gradedSince?: string } = {}) {
  const search = new URLSearchParams();
  if (params.submittedSince) search.set('submitted_since', params.submittedSince);
  if (params.gradedSince) search.set('graded_since', params.gradedSince);
  if (!search.has('per_page')) search.set('per_page', '100');
  return canvasFetch(`/api/v1/courses/${courseId}/students/submissions?${search.toString()}`);
}

export async function fetchCanvasDeltas() {
  // TODO: combine activity/submissions as needed and return normalized deltas
  return [] as any[];
}
```

## API ROUTES
**/app/api/student-data/route.ts**
```ts
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
```

**/app/api/student-data/reset/route.ts**
```ts
import { requireSession } from '@/lib/auth/auth0';
import { saveStudentData } from '@/lib/storage';
import { makeFreshStudentData } from '@/lib/student/transform';

export async function POST() {
  await requireSession();
  const fresh = makeFreshStudentData();
  await saveStudentData(fresh);
  return Response.json({ ok: true });
}
```

**/app/api/student-data/update/route.ts**
```ts
import { requireSession } from '@/lib/auth/auth0';
import { loadStudentData, saveStudentData } from '@/lib/storage';
import { fetchCanvasDeltas } from '@/lib/canvas/activity';
import { applyDeltas, recomputeStatuses } from '@/lib/student/transform';

export async function POST() {
  await requireSession();
  const current = (await loadStudentData()) ?? { students: [] };
  const deltas = await fetchCanvasDeltas();
  const merged = recomputeStatuses(applyDeltas(current, deltas));
  await saveStudentData(merged);
  return Response.json({ ok: true });
}
```

## UI PAGES (minimal)
**/app/(app)/dashboard/page.tsx**
```tsx
import React from 'react';

async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/student-data`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default async function DashboardPage() {
  const data = await getData();
  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
```

**/app/(app)/settings/page.tsx**
```tsx
export default function SettingsPage() {
  return <div>Settings will go here.</div>;
}
```

## PACKAGE + SCRIPTS
Ensure `package.json` includes only necessary deps and Next.js App Router. No client sub-app.

Scripts should be basic: `dev`, `build`, `start`.

## VERIFICATION CHECKLIST (do not skip)
- [ ] `GET /api/student-data` returns a JSON object (default with two seed students after reset).
- [ ] `PUT /api/student-data` accepts only schema-valid payloads.
- [ ] `POST /api/student-data/reset` seeds the store.
- [ ] `POST /api/student-data/update` runs without throwing; merge is idempotent.
- [ ] All four routes require Auth0; unauthenticated requests get 401 via middleware.
- [ ] No unused files, no sample/demo pages besides dashboard/settings.
- [ ] No console logs in loops; minimal logging elsewhere.
- [ ] Variable/function names use camelCase.
- [ ] Storage works on Vercel (KV keys present) — no use of local FS.

## OUT OF SCOPE (forbidden without explicit request)
- No database migrations or ORM setup.
- No background cron/queue.
- No UI component libraries.
- No retry/backoff frameworks.
- No rate limiter yet (can add later if requested).

Follow this prompt exactly. When finished, present a concise diff‑style summary of files created/modified and any TODOs left in `transform.ts` and `activity.ts`. No commentary beyond that.


---

## Repository & Deployment (Vercel ⇄ GitHub "checkpoint")
- Initialize the project locally, commit, and push to **GitHub repo: `checkpoint`**.
- In Vercel dashboard: **Add New → Project → Import Git Repository → `checkpoint`**.
- Environment Variables: add the keys from `.env.example` in Vercel Project Settings → Environment Variables (do not commit secrets).
- Select Framework Preset **Next.js**; build command and output are auto-detected.
- On merge to `main`, Vercel auto-deploys. Use Preview Deployments for PRs.

## UI Index Page with "Get Student Data" button + Collapsible JSON Viewer
Add a minimal index page and a tiny, dependency-free collapsible viewer.

```
/app/page.tsx
```
```tsx
'use client';
import React from 'react';

function Toggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginLeft: 12 }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '▾' : '▸'} {label}
      </button>
      {open && <div style={{ paddingLeft: 16 }}>{children}</div>}
    </div>
  );
}

function JsonNode({ data, label }: { data: any; label: string }) {
  if (data === null || typeof data !== 'object') {
    return <div><strong>{label}:</strong> {String(data)}</div>;
  }
  if (Array.isArray(data)) {
    return (
      <Toggle label={`${label} [${data.length}]`}>
        {data.map((v, i) => (
          <JsonNode key={i} data={v} label={String(i)} />
        ))}
      </Toggle>
    );
  }
  return (
    <Toggle label={`${label} {}`}> 
      {Object.entries(data).map(([k, v]) => (
        <JsonNode key={k} data={v} label={k} />
      ))}
    </Toggle>
  );
}

export default function IndexPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  async function getStudentData() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/student-data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Checkpoint</h1>
      <p>Retrieve the latest <code>studentData</code> JSON.</p>
      <button onClick={getStudentData} disabled={loading}>
        {loading ? 'Loading…' : 'Get Student Data'}
      </button>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {data && (
        <div style={{ marginTop: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <JsonNode data={data} label="root" />
        </div>
      )}
    </main>
  );
}
```

> Guardrails: keep this client component minimal; no external JSON viewer libraries.

## Ports & Serverless on Vercel
- In local dev, Next.js runs on a **single port** (default **3000**). Both UI and serverless API routes share this origin (e.g., `http://localhost:3000` and `http://localhost:3000/api/...`).
- On Vercel, there is **no need** to split ports (e.g., 3000 vs 3001). Serverless functions under `/app/api/*` are deployed behind the same hostname and path (`/api/*`).
- Do **not** introduce a separate Express server or port unless explicitly required. Keep a single Next.js app with serverless routes.

