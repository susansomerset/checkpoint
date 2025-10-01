# Spec Fixlog

This log tracks **corrections and modifications** to already-implemented spec nodes in `spec/current.json`.

**Scope:** Only log changes/fixes to specs that have been implemented and committed. Initial implementations are tracked in git history and delivery notes, not here.

---

## 2025-10-01 – Empty cells show nothing instead of em dash

**Issue/Context:**  
PO review found that empty cells were displaying "—" which added visual noise to the grid.

**Affected Spec Nodes:**  
- `ui.WeeklyGrid@1.0.1`

**Resolution:**  
- Updated spec rendering rules: empty cells return `null` instead of placeholder text
- Changed `renderGridItems` and `renderNoDate` functions accordingly
- Empty cells now render completely blank

**Commit:**  
(pending)

**Notes:**  
Visual improvement requested during PO review of /assignments page.

---

## 2025-10-01 – Student header displays studentId instead of preferredName

**Issue/Context:**  
PO review found that WeeklyGrid student header row displays "Student: S1" (studentId) instead of the student's preferred name. Additionally, the UI component was "smart" - it was building the header string from passed data instead of just rendering pre-formatted content.

**Affected Spec Nodes:**  
- `processing.getWeeklyGrids@1.0.2` → `@1.0.3`
- `ui.WeeklyGrid@1.0.1` → `@1.0.2`

**Resolution:**  
**Compose layer (`getWeeklyGrids`):**
- Added `studentHeader: string` field to `WeeklyGridHeader` output
- Format: `"${preferredName || legalName || studentId} — ⚠️:W / ❓:Q / 👍:T / ✅:C"`
- Compose layer now responsible for all header text formatting

**UI layer (`WeeklyGrid`):**
- Removed `formatAttentionSummary()` helper function (logic moved to compose)
- Render `header.studentHeader` as-is in a `<th colSpan={9}>` row above column headers
- UI is now pure presentation - no formatting logic

**Architectural improvement:**
- Follows "compose thinks, UI renders" principle
- Student header is part of grid.header structure (semantic grouping)
- UI component has zero business logic

**Commit:**  
4a65b7e

**Notes:**  
Student header now appears above column headers in table structure. UI automatically spans full width using colSpan.

---

## 2025-10-01 – Remove data recovery/reshaping logic from page layer

**Issue/Context:**  
Page layer (lines 22-40) attempts to recover from missing/malformed data by extracting, reshaping, and providing fallbacks. This is business logic that doesn't belong in a page component.

**Root Cause:**  
Page was implemented with defensive data recovery logic instead of delegating to compose layer or failing gracefully with error message.

**Affected Spec Nodes:**  
- `page.Assignments@1.0.1` → `@1.0.2` (implementation correction)

**Resolution:**  
**Page layer (`assignments/page.tsx`):**
- Remove data recovery/reshaping block (lines 22-40)
- Pass `data` directly to `getWeeklyGrids` without transformation
- If compose layer can't handle the data, let it fail and show error to user
- Page displays: "Unable to load assignments. Please refresh the page or contact support."

**Commit:**  
12edde1

**Notes:**  
Data recovery and transformation is compose layer's responsibility. Page should be dumb: pass data through or show error.

---

## 2025-10-01 – WeeklyGrid empty: grids not generated from StudentData

**Issue/Context:**  
Assignments page displays "Unable to load assignments" error because `weeklyGrids` is empty. Root cause: `getWeeklyGrids` expects simplified `StudentDataInput` type but page passes `StudentData` from context, causing type mismatch and preventing grid generation.

**Root Cause:**  
Architecture mismatch. `getWeeklyGrids` was implemented with fixture-based simplified types, but StudentData has complex nested structure (Records instead of arrays, canvas fields instead of flattened data). No adapter exists to bridge the gap.

**Affected Spec Nodes:**  
- `processing.getWeeklyGrids@1.0.3` → `@1.0.4`
- `ui.WeeklyGrid@1.0.2` → `@1.0.3`
- `context.StudentContext` (implementation only, no spec)
- `page.Assignments@1.0.2` → `@1.0.3`

**Resolution:**  

**Compose layer (`getWeeklyGrids.ts`):**
- Add internal `adaptStudentData()` function to convert StudentData → StudentDataInput
- Extract data from proper sources:
  - Student name: `meta.preferredName || meta.legalName || studentId`
  - Course name: `meta.shortName || canvas.name`
  - Assignment name: `canvas.name`
  - Due date: `canvas.due_at` (extracts from Canvas API data)
  - Assignment URL: `canvas.html_url` with fallback to constructed URL
  - Status: `meta.checkpointStatus`
- Update function signature to accept `StudentData` type
- Use proper typing (CanvasAssignment) with type assertions where needed
- Adapter is internal implementation detail, not exported

**StudentContext:**
- Add `weeklyGrids: WeeklyGridsResult | null` to context state
- Compute grids in useEffect when `selectedStudentId` changes
- Filter StudentData to only selected student before passing to getWeeklyGrids
- Store result in context for page consumption
- Handle type compatibility between StudentDataContract and StudentDataBuilder

**Page layer (`assignments/page.tsx`):**
- Remove all data transformation logic (already done in previous commit)
- Read `weeklyGrids` from context
- Pass directly to WeeklyGrid component
- Page is completely dumb: no computation, just reads from context

**UI layer (`WeeklyGrid.tsx`):**
- Fixed header text colors: Student header and column headers now solid black (#000000)
- Added today column highlighting: entire column gets `bg-yellow-50` background
- Fixed Warning text highlighting: Applied `bg-yellow-200` to `<span>` inside `<a>` tag (not to `<a>` itself)
  - Prevents entire cell from being highlighted
  - Only the text gets yellow background (like highlighter marker)
- Improved text contrast: Darker colors for all text (green-700, blue-700, red-700, gray-900)
- Course names: `text-gray-900` for better readability

**Commit:**  
6cc794d

**Notes:**  
This completes the proper layering: Context computes and caches grids when student changes. Page just reads pre-computed data. Compose layer owns data extraction via internal adapter. Grids regenerated fresh (with current "now" timestamp) whenever student selection changes. UI improvements ensure proper text contrast and highlighting behavior.

---

## 2025-10-01 – Assignment bucketing issues + icon visibility (stale data + UI polish)

**Issue/Context:**  
PO reported two issues:
1. Assignment #832587 appearing in wrong column (Monday 9/29 instead of Next Week)
2. Assignment #886535 showing Warning instead of expected attention type
3. Check icons (✓) appearing as light gray and nearly invisible

**Root Cause:**  
**Issues 1 & 2:** Stale cached StudentData. Canvas had updated assignment due dates after data was cached. Investigation consumed significant time before discovering data was last updated 9/30 at 12:15pm.

**Issue 3:** UI used '✓' (light gray checkmark character) instead of '✅' (green checkbox emoji).

**Affected Spec Nodes:**  
- `ui.WeeklyGrid@1.0.3` → `@1.0.4` (icon fix + debug improvements)
- `app.Scratchpad` (implementation only, no spec)

**Resolution:**  

**Data freshness (no code changes):**
- Reset student data via dashboard to pull fresh Canvas data
- Assignment #832587 now correctly shows in Next Week column with correct due date
- All bucketing and attention type logic verified correct

**UI layer (`WeeklyGrid.tsx`):**
- Changed Check icon from '✓' to '✅' for visibility

**Scratchpad improvements:**
- Added "Most Recent Assignment Update" display (scans all assignments for MAX updated_at)
- Added working "Reset Student Data" button (calls /api/student-data/reset)
- Helps diagnose stale data issues in future

**Commit:**  
(pending)

**Notes:**  
Lesson learned: Always check data freshness before debugging logic. The adapter, bucketing, and attention type implementations were all correct. Added scratchpad tools to quickly identify stale data in future. PO lost a year off their life yelling about font colors (all fixed now with solid black headers and proper text contrast).
