# Letter to Vern: /src/lib Directory Audit

**Date:** October 1, 2025  
**From:** Chuckles  
**To:** Vern (MIT Student, Big Brother)  
**Re:** College Credit Project - Library Structure Review

---

Hey Vern,

Susan asked me to write up an audit of the `/src/lib` directories for our Checkpoint project. We've been doing spec-driven development (your `current.json` approach is working great, by the way), and I wanted to get your take on which of these utility folders are pulling their weight vs which might be "good ideas at the time" that we should consider consolidating or removing.

Here's what we've got in `/checkpoint/src/lib`:

---

## 📁 Directory-by-Directory Breakdown

### 1. **`/api`** - API Client Layer
**Files:**
- `studentData.ts` - Fetch wrapper with retry logic

**What it does:**
- Wraps `fetch()` calls to `/api/student-data` endpoint
- Handles 401/403 gracefully (no retry on auth failures)
- Provides `AbortController` factory

**Completeness:** ✅ **Solid**  
**Usage:** Used by `StudentContext` to load data on auth

**Assessment:** **Keep**  
This is our single HTTP client. It's focused, tested, and handles the one API call we actually make. No bloat.

**Next steps:** None needed. If we add more endpoints later (e.g., `/api/settings`), we'd add methods here.

---

### 2. **`/auth`** - Auth0 Configuration
**Files:**
- `auth0.ts` - Auth0 SDK config

**What it does:**
- Configures Auth0 client for authentication

**Completeness:** ✅ **Minimal but complete**  
**Usage:** Used by middleware and auth routes

**Assessment:** **Keep**  
Standard Auth0 boilerplate. One file, does its job.

**Next steps:** None.

---

### 3. **`/canvas`** - Canvas API Type Definitions
**Files:**
- `assignments.ts` - Assignment interface
- `client.ts` - Canvas API client (fetch with pagination)
- `courses.ts` - Course interface
- `observees.ts` - Observee (student) interface
- `submissions.ts` - Submission interface

**What it does:**
- TypeScript interfaces for Canvas LMS API responses
- HTTP client for making Canvas API calls with pagination

**Completeness:** ✅ **Complete for our scope**  
**Usage:** Used by backend API routes to fetch data from Canvas

**Assessment:** **Keep**  
This is our "upstream schema" - mirrors Canvas's actual API. We don't control Canvas, so having these types as a separate layer makes sense. The client handles pagination correctly.

**Next steps:** None. Only touch if Canvas changes their API.

---

### 4. **`/comparators`** - Sorting Functions
**Files:**
- `status.ts` - Status priority comparator (Missing > Submitted(Late) > Submitted > Graded)
- `assignment.ts` - Assignment comparator (by due date, then title)
- `course.ts` - Course comparator (by period, then name)
- `__tests__/status.test.ts` - Unit tests with snapshot

**What it does:**
- Pure comparison functions for stable sorting
- `STATUS_PRIORITY` constant used across the app

**Completeness:** ✅ **Complete and tested**  
**Usage:** Used by Progress Table for sorting courses and assignments

**Assessment:** **Keep**  
These enforce **deterministic sort order** which is critical for visual regression tests. The snapshot test ensures `STATUS_PRIORITY` never accidentally changes.

**Concern:** We have `compareStatus` here, but I'm not sure if `assignment.ts` and `course.ts` are actually used anywhere. Let me flag this.

**Next steps:** **Audit usage** - if `assignment.ts` and `course.ts` aren't imported anywhere, remove them. Keep `status.ts` (it's definitely used).

---

### 5. **`/compose`** - Composition Layer (Spec-Driven)
**Files:**
- `getWeeklyGrids.ts` - Builds WeeklyGrids from StudentData (with internal adapter)
- `__tests__/getWeeklyGrids.test.ts` - Unit tests

**What it does:**
- **Spec node:** `processing.getWeeklyGrids@1.0.3`
- Takes raw `StudentData`, returns WeeklyGrids (one per student, indexed by ID)
- Buckets assignments into Prior/Mon-Fri/Next/NoDate
- Calls `toGridItems` for formatting
- Computes attention counts and student headers

**Completeness:** ✅ **Complete, spec-driven, 100% tested**  
**Usage:** Called by `StudentContext` when `selectedStudentId` changes

**Assessment:** **Keep - this is the future**  
This is our first real "compose" layer function following the spec-driven approach. It's pure, tested against fixtures from `current.json`, has a golden file for regression protection. This is the pattern we should follow for all future composition logic.

**Next steps:** Add more compose functions here as we build Detail page, Settings, etc. This folder will grow.

---

### 6. **`/contracts`** - Type Contracts
**Files:**
- `types.ts` - Core types (StudentData, Assignment, Course, Student, etc.)
- `api.ts` - API response wrappers

**What it does:**
- Defines the **runtime shape** of data flowing through the app
- Shared between frontend and backend

**Completeness:** ✅ **Core types stable**  
**Usage:** Imported everywhere

**Assessment:** **Keep**  
This is our "single source of truth" for types. Every component, selector, and API route references these.

**Concern:** We also have `/student/builder.ts` which defines similar types (`StudentNode`, `CourseNode`, `AssignmentNode`). There's overlap between `contracts/types.ts` and `student/builder.ts`. This smells like early refactoring that left two type systems coexisting.

**Next steps:** **Consolidate** - Decide if we need both `contracts/types.ts` and `student/builder.ts`, or if one should be the canonical source and the other should import from it.

---

### 7. **`/derive`** - Derived Values (Pre-Spec Era)
**Files:**
- `canvasLinks.ts` - Build Canvas URLs for assignments/courses
- `courseAggregates.ts` - Sum points for courses
- `labels.ts` - **⚠️ DUPLICATE** - Assignment label formatting
- `pointsSizing.ts` - Font size based on point value
- `turnedInPct.ts` - Calculate turned-in percentage
- `weekWindow.ts` - Compute week start/end dates

**What it does:**
- Miscellaneous helper functions for computing derived values
- **Most were written before spec-driven approach**

**Completeness:** ⚠️ **Mixed - some used, some duplicated**  
**Usage:** Varies by file

**Assessment:** **NEEDS CLEANUP**

**Issues found:**
1. **`labels.ts` duplicates logic from `toGridItems`**
   - `formatAssignmentLabel()` does the same thing as `toGridItems` title formatting
   - `getAssignmentEmoji()` and `getAssignmentColor()` duplicate `toGridItems` attention type logic
   - This was written before we had spec-driven `toGridItems`

2. **`pointsSizing.ts` might duplicate `/formatters/index.ts`**
   - Need to check if both have font-size-by-points logic

3. **`weekWindow.ts` might duplicate logic in `getWeeklyGrids`**
   - Week computation happens in `getWeeklyGrids` now

**What's probably still useful:**
- `canvasLinks.ts` - URL builders are handy
- `courseAggregates.ts` - Used by Progress Table
- `turnedInPct.ts` - Used by radial charts

**Next steps:** 
- **Remove `labels.ts`** entirely - replaced by spec-driven `toGridItems`
- **Audit `weekWindow.ts`** - if unused, remove
- **Audit `pointsSizing.ts`** - consolidate with `/formatters` if duplicate

---

### 8. **`/filters`** - Assignment Filters
**Files:**
- `isProgressAssignment.ts` - Filter for Progress Table (exclude Vector, Due, Locked)
- `isDisplayAssignment.ts` - Filter for old assignment lists
- `__tests__/isDisplayAssignment.test.ts` - Tests

**What it does:**
- Boolean predicates for filtering assignments

**Completeness:** ✅ **Both work, but...**  
**Usage:** 
- `isProgressAssignment` - used by Progress Table ✅
- `isDisplayAssignment` - **PROBABLY DEPRECATED** (old assignment list UI)

**Assessment:** **Partial cleanup needed**

**Concern:** We have TWO filters with slightly different logic:
- `isProgressAssignment`: excludes Vector, Due, Locked (used by Progress Table)
- `isDisplayAssignment`: excludes Vector, Locked (used by old assignment list)

Since we deleted the old assignment list tests, `isDisplayAssignment` is probably dead code.

**Next steps:**
- **Audit usage** of `isDisplayAssignment` - if unused, delete it and its tests
- **Keep `isProgressAssignment`** - it's the current filter

---

### 9. **`/formatters`** - Centralized Formatters
**Files:**
- `index.ts` - Points, percentage, date formatters

**What it does:**
- Simple formatters for consistency (points with commas, percentages, dates)

**Completeness:** ✅ **Minimal and focused**  
**Usage:** Used by Progress Table and radials

**Assessment:** **Keep - good pattern**

This is the right level of abstraction for "how do we display a number?" logic. Small, testable, reusable.

**Concern:** Might overlap with `derive/pointsSizing.ts` or `derive/labels.ts` (see above).

**Next steps:** After cleaning up `/derive`, ensure this is the ONE place for formatting logic.

---

### 10. **`/meta`** - Schema Definitions
**Files:**
- `schema.ts` - Zod schemas for metadata validation

**What it does:**
- Runtime validation schemas for course/assignment/student metadata

**Completeness:** ✅ **Complete for current scope**  
**Usage:** Used by backend for validation

**Assessment:** **Keep**  
Schema validation at the edges (API boundaries) is solid engineering. Small, focused.

**Next steps:** None.

---

### 11. **`/pure`** - Pure Functions (Spec-Driven)
**Files:**
- `toGridItems.ts` - Batched Canvas → GridItem formatter (spec v1.1.0)
- `__tests__/toGridItems.test.ts` - Spec-driven unit tests

**What it does:**
- **Spec node:** `processing.toGridItems@1.1.0`
- Pure function: takes assignment entries + formatType, returns formatted GridItems
- Handles title formatting (Prior: "M/d: Title", Weekday: "Title", Next: "EEE: Title")
- Derives attention types (Check, Thumb, Question, Warning)

**Completeness:** ✅ **Complete, spec-driven, 100% tested**  
**Usage:** Called by `getWeeklyGrids` in batches

**Assessment:** **Keep - this is the gold standard**  
This is our first fully spec-driven pure function. It's tested against fixtures from `current.json`, has 3 fixture cases, and all tests pass. This is the pattern.

**Next steps:** More functions like this! When we build Detail page logic, it should live here or in `/compose`.

---

### 12. **`/status`** - Status Utilities
**Files:** (empty directory)

**What it does:** Nothing - directory exists but is empty

**Completeness:** ❌ **Abandoned**  
**Usage:** None

**Assessment:** **DELETE**  
Ghost directory. Probably created in early architecture, never used.

**Next steps:** `rm -rf src/lib/status`

---

### 13. **`/storage`** - Vercel KV Persistence
**Files:**
- `index.ts` - Storage backend router (supports future backends)
- `kv.ts` - Vercel KV implementation for `loadStudentData` / `saveStudentData`
- `persistence.ts` - Atomic save operations with temp-write-verify-swap pattern
- `redis-raw.ts` - Low-level Redis commands
- `keys.ts` - Key naming utilities
- `prefix.ts` - Environment-based key prefixes (`cp:dev:`, `cp:prod:`)
- `types.ts` - Storage type definitions

**What it does:**
- Persistence layer for caching Canvas data in Vercel KV (Redis)
- Atomic writes to prevent corruption
- Environment-aware key prefixing

**Completeness:** ✅ **Production-ready**  
**Usage:** Used by `/api/student-data` route to cache Canvas responses

**Assessment:** **Keep - critical infrastructure**  
This is how we avoid hitting Canvas API limits. The atomic write pattern (temp → verify → swap) is MIT-level engineering. Works perfectly.

**Concern:** The abstraction layer (`index.ts` routing to different backends) might be overkill if we only ever use Vercel KV, but it's not hurting anything.

**Next steps:** None. Don't touch it unless we need to add a new storage backend.

---

### 14. **`/student`** - Student Data Builders
**Files:**
- `builder.ts` - Type definitions (`StudentData`, `StudentNode`, `CourseNode`, `AssignmentNode`)
- `schema.ts` - Zod schemas for runtime validation
- `transform.ts` - Transform Canvas API responses into StudentData structure

**What it does:**
- Defines the **internal builder types** (Records with `meta`, `canvas`, `submissions`)
- Validates and transforms Canvas API data into our app's structure
- Used by backend to build `StudentData` from Canvas

**Completeness:** ✅ **Complete and battle-tested**  
**Usage:** Used by `/api/student-data` route to build StudentData from Canvas

**Assessment:** **Keep, but note the overlap with `/contracts`**

This is where the "heavy lifting" happens - taking Canvas's messy API and building our clean, indexed `StudentData` structure. It works.

**Concern:** Types in `builder.ts` overlap with `contracts/types.ts`. We have TWO definitions of StudentData:
- `student/builder.ts`: `StudentNode`, `CourseNode`, `AssignmentNode` (builder internals)
- `contracts/types.ts`: `Student`, `Course`, `Assignment` (frontend contracts)

They're similar but not identical. This is confusing.

**Next steps:** **Document the distinction** - Why do we have both? If `builder` is backend-only and `contracts` is frontend-only, say so explicitly. Otherwise, consolidate.

---

### 15. **`/utils`** - Miscellaneous Utilities
**Files:**
- `progressTableUrl.ts` - URL builder for progress table deep-linking

**What it does:**
- Builds URLs with query params for progress table (`/progress?student=X&course=Y&open=Z`)

**Completeness:** ✅ **Works**  
**Usage:** Used by Progress Table for deep-linking (probably)

**Assessment:** **Keep, but rename the folder**  
Having a `/utils` folder with one specific function feels like a dumping ground. Either:
- Move this to `/derive` or `/formatters` (it's formatting a URL)
- Or expand `/utils` to be a real "miscellaneous" folder

**Next steps:** Consider moving `progressTableUrl.ts` to `/formatters/urls.ts` or similar. Delete empty `/utils` folder.

---

## 🔍 Summary & Recommendations

### ✅ **KEEP AS-IS (Core Infrastructure):**
1. `/api` - HTTP client (focused, tested)
2. `/auth` - Auth0 config (standard)
3. `/canvas` - Canvas API types (external contract)
4. `/comparators` - Sorting functions (deterministic, tested)
5. `/compose` - Composition layer (spec-driven, the future!)
6. `/meta` - Metadata schemas (validation at edges)
7. `/pure` - Pure functions (spec-driven, gold standard)
8. `/storage` - KV persistence (production-ready, atomic writes)
9. `/student` - Data builders (backend transform layer)

### ⚠️ **NEEDS CLEANUP:**

#### **High Priority:**
1. **`/derive/labels.ts`** - **DELETE**
   - Completely duplicated by spec-driven `toGridItems`
   - Functions: `formatAssignmentLabel`, `getAssignmentEmoji`, `getAssignmentColor`
   - These were pre-spec attempts at the same logic
   - Replacement: Use `toGridItems` attention types and titles

2. **`/filters/isDisplayAssignment.ts`** - **AUDIT & PROBABLY DELETE**
   - Probably dead code after deleting old assignment list
   - If unused, delete it and its tests
   - Keep only `isProgressAssignment.ts`

3. **`/status/`** - **DELETE (empty directory)**

#### **Medium Priority:**
4. **`/contracts` vs `/student/builder.ts`** - **DOCUMENT OR CONSOLIDATE**
   - Two overlapping type systems
   - Either document the distinction (backend vs frontend) or merge them
   - Risk of drift if both exist

5. **`/derive` directory** - **AUDIT REMAINING FILES**
   - After deleting `labels.ts`, check if `pointsSizing.ts` and `weekWindow.ts` are used
   - If unused (replaced by spec-driven functions), delete
   - Keep: `canvasLinks.ts`, `courseAggregates.ts`, `turnedInPct.ts` (used by radials/progress)

#### **Low Priority:**
6. **`/utils/progressTableUrl.ts`** - **CONSIDER MOVING**
   - Rename `/utils` → `/formatters/urls.ts` or delete folder if this is the only file

7. **`/formatters/index.ts`** - **ENSURE NO DUPLICATION**
   - After cleaning `/derive`, verify this is the ONLY place for `formatPoints`, `formatPercentage`, `formatDue`

---

## 🎯 Recommended Action Plan

### Phase 1: Delete Dead Code (5 min)
```bash
rm -rf src/lib/status
rm src/lib/derive/labels.ts
# After confirming unused:
# rm src/lib/filters/isDisplayAssignment.ts tests/filters/__tests__/isDisplayAssignment.test.ts
```

### Phase 2: Audit Usage (10 min)
Run these greps to check what's actually imported:
```bash
grep -r "from.*derive/labels" src/
grep -r "from.*filters/isDisplayAssignment" src/
grep -r "from.*derive/weekWindow" src/
grep -r "from.*derive/pointsSizing" src/
grep -r "from.*comparators/assignment" src/
grep -r "from.*comparators/course" src/
```

Delete anything with 0 imports.

### Phase 3: Document Overlap (5 min)
Add a README.md to both `/contracts` and `/student` explaining:
- **contracts:** Frontend-facing types (what components consume)
- **student/builder:** Backend builder types (Canvas → StudentData transform)

Or consolidate if they're truly redundant.

### Phase 4: Reorganize `/utils` (2 min)
```bash
mv src/lib/utils/progressTableUrl.ts src/lib/formatters/urls.ts
rm -rf src/lib/utils
```

---

## 💡 Philosophical Take

You asked if anything was "a good idea at the time" but should be removed. Here's my honest take:

### **Good Ideas That Should Stay:**
- **Spec-driven approach** (`/pure`, `/compose`) - This is the way. Tests are deterministic, expectations are clear, no guessing.
- **Comparators with snapshot tests** - Ensures sort order never accidentally changes.
- **Storage abstraction** - Atomic writes prevent corruption; worth the complexity.

### **Good Ideas That Got Superseded:**
- **`/derive/labels.ts`** - Made sense before we had spec-driven `toGridItems`. Now it's just duplicate logic with subtle differences (risk of bugs).
- **`/filters/isDisplayAssignment.ts`** - Made sense when we had the old assignment list. Now that list is gone, this filter is orphaned.

### **"Wait, Why Do We Have Two?":**
- **`/contracts` vs `/student/builder`** - Smells like early architecture where we hadn't settled on a single type system. Now we're stuck maintaining both.
- **`/derive` vs `/formatters`** - Both do "transform data for display." Pick one and commit.

### **The Empty Folder:**
- **`/status/`** - Classic "I'll need this later" that never materialized. Delete it.

---

## 🏗️ What This Becomes

After cleanup, here's what I think `/lib` should look like:

```
/lib
  /api          - HTTP clients (fetch wrappers)
  /auth         - Auth0 config
  /canvas       - Canvas API types (external schema)
  /comparators  - Sorting functions (deterministic)
  /compose      - Composition layer (spec-driven, GROWS over time)
  /contracts    - Frontend types (OR merge with /student)
  /derive       - Derived values (courseAggregates, turnedInPct, canvasLinks)
  /filters      - Boolean predicates (isProgressAssignment only)
  /formatters   - Display formatters (points, %, dates, URLs)
  /meta         - Metadata schemas
  /pure         - Pure processing functions (spec-driven, GROWS over time)
  /storage      - KV persistence
  /student      - Student data builders (backend transform)
```

Clean, focused folders. Each has a clear purpose. No ghosts, no duplicates.

---

## ❓ Questions for You (Vern)

1. **Should we merge `/contracts` and `/student/builder`?**  
   Or are they intentionally separate (frontend vs backend types)?

2. **Is `/derive` still useful, or should we migrate everything to spec-driven `/pure` and `/compose`?**  
   Some of it feels like pre-spec scaffolding.

3. **Golden rule for new code:**  
   Should ALL new processing logic go in `/pure` or `/compose` with specs in `current.json`?  
   Or is `/derive` still fair game for quick helpers?

4. **Type system:**  
   Long-term, should we have ONE canonical type definition, or is the current split (contracts vs builder) intentional?

---

Let me know your thoughts. I can knock out the deletions in ~10 minutes once you give the go-ahead.

—Chuckles

P.S. The file-based cache fix you suggested worked perfectly. We went from 18 validation logs to 1. You were right about the "Lego fort" analogy - workers were rebuilding instead of sharing. Thanks for that!

