# Canvas Checkpoint Frontend Technical Design

*A comprehensive technical design for the Canvas Checkpoint parent and student assignment dashboard frontend*

---

## Table of Contents

1. [Goals & Guardrails](#goals--guardrails)
2. [Architecture](#architecture)
3. [Pages & Behavior](#pages--behavior)
4. [Components & Files](#components--files)
5. [Libraries](#libraries)
6. [Data Contract & Derivations](#data-contract--derivations)
7. [Testing (TDD You Will Actually Write)](#testing-tdd-you-will-actually-write)
8. [Delivery Rules](#delivery-rules)

---

## 1. Goals & Guardrails

*"Scope creep — not today. We're shipping exactly what's defined."*

Implement Progress, Student Progress (aggregated), Assignments (weekly grid), Detail, Settings, Student Select, Refresh exactly per scope. No schema edits; compute on read.

Read from `GET /api/student-data` (already RLS-filtered). Don't invent new APIs.

---

## 2. Architecture

*"Auth you glad we aren't touching the login again?"*

Next.js App Router. Protected routes via existing Auth0 setup.

Global Progress Header sits under the app shell; it updates as the selected student changes.

Server components fetch studentData once per page; client components handle local interactions only (expanders, tabs, modal toggles).

---

## 3. Pages & Behavior

### 3.1 Global Progress Header

*"Chart to your heart's content — but only with Apex."*

Uses ApexCharts via our existing composite radial component. It renders four layers (Earned / Submitted / Missing / Lost). Center shows turned-in %; if no Missing, show a 🎉 checkmark. Ordered by Period (from course metadata). Course & teacher label below chart.

Hover shows the same detail panel semantics as canvas-checkpoint.

**CRITICAL:** Ensure Apex radial renders **client-side only** to avoid hydration mismatch:
```tsx
"use client";
import dynamic from "next/dynamic";
const ProgressRadial = dynamic(() => import('@/components/ProgressRadial'), { ssr: false });
```

**Helpers:** `deriveCourseAggregates`, `deriveStatusBuckets`, `computeTurnedInPct`. (pure)

### 3.2 Student Progress (aggregated)

*"Period first — that's the order, period."*

Collapsible by course, ordered by Period. Subgroups appear in this order: Missing, Submitted, Submitted (On time), Graded. Show counts, total possible, graded points, and graded/possible %. Each assignment lists due date in parentheses and links to Canvas. Filter to selected student only.

Exclude "Vector" assignment type from this view at render-time via filter on `assignmentType`, not status.

### 3.3 Assignments (weekly grid)

*"Friday I'm in love… with your late-logic edge cases."*

Rows = course short name; columns: Past Due, Mon–Fri (current week; Sat/Sun → Monday), Next Week, No Due Date summary.

**CRITICAL:** All weekly grid/date math must run in **America/Los_Angeles** (not host TZ). Use UTC constructors + explicit conversion or `Intl` APIs.

**Rendering rules (must match scope exactly):**

- Bullets & color by status: ❓ red (≤1 weekday late), ⚠️ red+yellow (>1 weekday late), 👍 blue (due & not completed), ✅ green (completed).
- Current day column highlighted pale yellow (Monday if weekend).
- Label formats by column:
  - Prior weeks: `M/D: Name (points)`
  - Mon–Fri: `Name (points)`
  - Next Week: `Day: Name (points)`
- Font size: 5–9 small; 10–29 normal; ≥30 large + bold. Bullet size never changes.
- All items link to Canvas assignment URL with `rel="noopener noreferrer"`.

### 3.4 Detail ("kitchen sink")

*"Table stakes: show everything, paginate client-side if needed."*

Big, filterable/sortable table across all assignments for the selected student, including course info and submission details; everything links to Canvas. Start simple HTML table + small helpers. Upgrade to TanStack only if we truly need advanced column filter UX.

### 3.5 Settings

*"Settings the record straight: metadata lives here."*

Modal with tabs: Student Metadata (legal/preferred name) and Course Metadata (Short Name, Teacher, Period). Preferred name shows on all student toggles; Period drives ordering everywhere. Also the Autorefresh toggles (midnight PT full refresh; quick cadence minutes 0–60). 

**Refresh UX:** Spinner for in-flight Full; timer icon for Quick. Keep current data visible; refetch and **swap atomically** on success. Show "Last updated: <time> PT" from `lastLoadedAt`.

---

## 4. Components & Files

*"Helpers forever — pure, typed, and testable."*

- `components/ProgressHeader.tsx` — renders all composite radials beneath nav; consumes helpers.
- `components/ProgressRadial.tsx` — adapter around react-apexcharts (our custom composite).
- `components/StudentToggle.tsx` — preferred-name buttons.
- `components/ProgressTable.tsx` — aggregated status view.
- `components/WeeklyGrid.tsx` — rules-heavy grid.
- `components/DetailTable.tsx` — semantic table + helper filters; add TanStack later if justified.
- `components/Settings/*` — Student/Course metadata forms; Autorefresh modal (Headless UI).

**`lib/derive/*` (pure):**
- `statusBuckets.ts`, `courseAggregates.ts`, `turnedInPct.ts`,
- `weekWindow.ts` (Sat/Sun→Mon, previous weekday, Pacific time),
- `labels.ts` (column-specific formatting), `pointsSizing.ts` (font sizes).

---

## 5. Libraries

*"Bundle of joy — because we kept it lean."*

**Charts:** apexcharts + react-apexcharts (required by our custom radial).

**UI primitives:** @headlessui/react for Dialog/Tabs/Menu; our own CSS tokens.

**Auth:** @auth0/nextjs-auth0 (existing).

**Optional (later):** @tanstack/react-table if Detail table needs it. (Start without.)

---

## 6. Data Contract & Derivations

*"Status: derived — not stored."*

UI consumes unchanged studentData + metaData with all raw Canvas nodes. No derived fields persist.

Backend supplies `assignmentType` (so UI can hide "Vector" where required) but doesn't bake that into status.

All math & grouping derived at read via helpers listed above.

---

## 7. Testing (TDD You Will Actually Write)

*"Tests you can run, not just admire."*

**CRITICAL - Exact Rule Coverage Tests:**
Add unit tests that **directly assert** each rendering rule (emoji, colors, size thresholds, "≤1 weekday late", weekend→Monday) and the **current-day highlight**. Treat them as acceptance tests.

**Unit (helpers):** status bucketing; turned-in %; week window & previous-weekday; label formatting by column type; points-to-font sizing; course aggregates and ordering by period.

**Components:**
- ProgressRadial: 4 layers sum; hover panel contents.
- WeeklyGrid: current-day highlight; emoji/color/size rules; link formatting per column.
- ProgressTable: subgroup order (Missing → Submitted → Submitted On Time → Graded), correct counts/percents, "Vector" hidden.

**Integration:**
- Settings edits write to metaData; preferred name & period reflect everywhere; refresh shows spinner/timer and swaps atomically with no tearing.
- **RLS & auth guard:** Every page fetches via RLS-filtered API; never trusts client params for `studentId`. Show friendly "no access" state if zero allowed students.

**Error/Empty States:** Define UI for: no assignments, no submissions, missing metadata, and failed refresh. Avoid spinners that never resolve; show retry.

**Accessibility:** aria-labels on bullets; tab order; contrast on red/yellow highlights. Add `prefers-reduced-motion` handling for chart/hover animations.

**Test Fixtures:** Create fixtures with >100 assignments and multiple late/edge cases so pagination and "weekday late" logic can't regress.

---

## 8. Delivery Rules

*"Scope locked. Ship it."*

**CRITICAL (blockers before merge):**
- No schema or Auth0 changes.
- No new client → Canvas calls. UI hits only our existing endpoints.
- Keep CSS utility tokens consistent; no ad-hoc inline styles except tiny layout tweaks.
- Do not introduce TanStack until a PR labels a specific, user-visible pain we can't solve with our helpers.
- **Client-only chart mount** with dynamic import and SSR disabled
- **Time zone guarantees** - all date math in America/Los_Angeles
- **Exact rule coverage tests** for all rendering rules
- **RLS & auth guard** - never trust client params for studentId
- **Error/empty states** defined for all failure modes
- **Accessibility** - contrast, aria-labels, keyboard navigation

**High-value (next commit):**
- **Refresh UX sanity** - visual affordances, atomic swap, last updated time
- **Detail table first pass** - semantic table + utilities
- **Assignment links** - proper rel attributes and column-specific formatting
- **Error boundary + route not-found** - avoid Next.js default pages
- **No PII in logs** - strip names/emails from client logs
- **Security headers** - minimal CSP for ApexCharts and domains

**Build order:** Progress Header, Student Progress, Weekly Grid, Detail, Settings. After each page, run the exact tests above before moving on.

---

## 9. Polish & Code-Level Guidelines

*"The devil is in the details."*

**Nice-to-have (polish that pays back):**
- **State URL-sync** - Persist selected student and active tab in URL (querystring)
- **Memoization footprint** - Memoize heavy derived aggregates per `(studentId, courseId, weekWindow)`
- **Lighthouse pass** - Run quick Lighthouse/axe pass; fix obvious a11y/Perf flags
- **CSP + dependency audit** - Verify chart package size; consider chunk-splitting chart bundle

**Tiny code-level nudges:**
- Use **UTC constructors** when making fixed dates (e.g., `Date.UTC(academicYear, 6, 1)` for July 1) to avoid DST weirdness
- Keep **IDs as strings** at the edges of the component layer to prevent accidental `Record<number,…>` vs `Record<string,…>` bugs
- For tests, create **fixtures** with >100 assignments and multiple late/edge cases so pagination and "weekday late" logic can't regress

---

## 10. Final Pre-Flight (5 Quick Checks)

*"Charts client-only: dynamic(() => import('@/components/ProgressRadial'), { ssr: false }) present where rendered."*

1. **Charts client-only:** `dynamic(() => import('@/components/ProgressRadial'), { ssr: false })` present where rendered.

2. **TZ discipline:** Tests run with `TZ=America/Los_Angeles`; helpers avoid local `new Date(y,m,d)` (use UTC + format).

3. **RLS fetch only:** Every page pulls via the RLS-filtered `/api/student-data`; no client-supplied `studentId` is trusted.

4. **Exact rule tests:** Emoji/color/size thresholds, Fri→Mon "≤1 weekday late," weekend→Monday highlight, column-specific labels all asserted.

5. **Empty/error states & a11y:** Friendly "no access," "no assignments/submissions," retry on failure; aria-labels for bullets, contrast passes on red/yellow.

## 11. Ship Order (Don't Deviate)

*"Progress Header → 2) Student Progress → 3) Weekly Grid → 4) Detail → 5) Settings."*

1. **Progress Header** → 2) **Student Progress** → 3) **Weekly Grid** → 4) **Detail** → 5) **Settings**.

After each page, run the rule tests before moving on. Definition-of-Done is captured in the design doc and the checklist above.

## 12. Nice-to-Have in the First PR After Merge

*"Show 'Last updated: <time> PT' (from lastLoadedAt)."*

- Show "Last updated: <time> PT" (from `lastLoadedAt`).
- Add Error Boundary & `/not-found`.
- Strip PII from client logs; minimal CSP for charts/Auth0/KV.

---

*"If those pre-flight boxes are checked, you've got my go for implementation. 🚀"*
