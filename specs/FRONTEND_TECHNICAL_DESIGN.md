# Canvas Checkpoint Frontend Technical Design

*A comprehensive technical design for the Canvas Checkpoint parent and student assignment dashboard frontend*

---

## Table of Contents

1. [Goals & Non-Goals](#goals--non-goals)
2. [Architecture](#architecture)
3. [Pages & UX](#pages--ux)
4. [Components & Files](#components--files)
5. [Data Flow & Access Control](#data-flow--access-control)
6. [Performance & Resilience](#performance--resilience)
7. [Testing (TDD Plan)](#testing-tdd-plan)
8. [Libraries](#libraries)
9. [File Inventory](#file-inventory)
10. [Open Questions / Future Notes](#open-questions--future-notes)

---

## 1. Goals & Non-Goals

*"The best way to find out what we really need is to get rid of what we don't." — Marie Kondo*

**Goals**

* Deliver UI per scope: **Progress charts**, **Student Progress (aggregated)**, **Assignments weekly grid**, **Detail table**, **Settings** (Student & Course metadata, Autorefresh), **Student Select**, **Refresh** actions. 
* Reuse **custom composite radial chart** and general look from canvas-checkpoint. 
* Enforce Auth0 across UI and apply **row-level access** (only allowed students).
* Keep **persistence schema unchanged**: `studentData` with raw Canvas under `canvas`, overlay meta under `meta`, and `lastLoadedAt`. `metaData` editable only from Settings. 
* Provide parents and students with a comprehensive, accessible interface to track academic progress across multiple classes and students.

**Non-Goals**

* No server/API refactors; no derived fields persisted.
* No background jobs from the UI; toggles only set flags the backend honors.
* No complex data processing utilities beyond what's necessary for UI display.

---

## 2. Architecture

*"Simplicity is the ultimate sophistication." — Leonardo da Vinci*

* Next.js **App Router**. Global layout renders **Progress header** on every page beneath.
* Auth0 client provider for client trees; server routes gated via session check.
* Data access:

  * **Server components** load page data via `GET /api/student-data` (RLS applied).
  * Client interactions (refresh/quick update/settings) call **existing** serverless endpoints—no new schema.
* State: Student selection (preferred name labels) from `metaData`, persisted UI choice in URL/search params or local state.

**🔧 [Changed]**: Explicit call-outs to compute all **aggregations client-side** (or in server components) from raw nodes—not stored in `studentData`.

---

## 3. Pages & UX

*"The details are not the details. They make the design." — Charles Eames*

### 3.1 Global Progress Header (visible on all pages)

* Composite radial chart (Earned / Submitted / Missing / Lost), center percent is "turned in" (Earned+Submitted+Lost vs total possible). Show 🎉 checkmark when no Missing. Hover panel reproduces canvas-checkpoint details. 
* **Charts ordered by course period** from `metaData.courses[courseId].period`
* **Course name and teacher name** displayed below each chart
* **🆕 Derived helpers** (pure): `deriveCourseAggregates`, `deriveStatusBuckets`, `computeTurnedInPct`.

### 3.2 Student Progress (aggregated table)

* Collapse by course (ordered by **Period** from `metaData.courses[courseId].period`) with four sub-sections in **this order**: Missing, Submitted, Submitted (On time), Graded. 
* Columns: count, total possible, graded points, graded/possible %. Items list under each status include due date in parentheses and link to Canvas assignment. **Filter by selected student only.** 
* **Exclude Vector assignments** from display (but keep in data for potential future use)

### 3.3 Assignments (weekly grid)

* Row = course short name (period order). Columns: **Past Due**, **Mon…Fri** (current week; Sat/Sun map to upcoming Monday), **Next Week**, **No Due Date** summary link. 
* Rendering rules (**must** be exact):

  * Bullet & color by status: ❓ red (≤1 weekday late), ⚠️ red+yellow (>1 weekday late), 👍 blue (due & not completed), ✅ green (completed).
  * **Current day column** highlighted pale yellow (Monday if Sat/Sun).
  * **Assignment label formats by column**:
    * **Prior weeks**: `M/D: Assignment Name (points)` - e.g., "8/29: Supply Check (5)"
    * **Monday-Friday**: `Assignment Name (points)` - e.g., "DYOE #3 (20)"
    * **Next Week**: `Day: Assignment Name (points)` - e.g., "Wed: Final Report Requirements (50)"
    * **No Due Date**: `Assignment Name (points)` - e.g., "Research Paper (100)"
  * Font size scales by points: 5–9 small, 10–29 normal, ≥30 large+bold. **Bullet size never changes.**
  * **All assignments hyperlink to Canvas assignment URL**

**🔧 [Changed]**: Your draft listed the grid but not the **full set of rendering rules**. They are now specified verbatim.

### 3.4 Detail (kitchen-sink)

* Filterable/sortable table across all assignments for the selected student, includes course info and submission fields, links to Canvas. 
* **Comprehensive data fields**:
  * Student Name, Class Name, Period, Teacher
  * Assignment Title, Points, Assigned Date, Due Date
  * Days Due, Status, Submitted Date, Score
  * Canvas Link, Course ID, Assignment ID
  * **Additional fields from canvas-checkpoint**: User ID, Raw assignment data, Raw submission data

### 3.5 Settings

* **Student Metadata**: edit legal/preferred name; popup accessible via Settings > Student Metadata; preferred name used in UI labels.
* **Course Metadata**: edit Short Name, Teacher, Period; displayed everywhere and drives ordering.
* **Autorefresh**: toggle nightly Full Refresh at **midnight PT**; set minutes (0–60) for AUTO quick update (0=disabled). Show status indicators in the menu (spinner for Full Refresh in-flight, timer icon for Quick cadence). User keeps access to current data while refresh runs. 
* **Modal-based interface** with tabbed navigation for Student and Course metadata editing
* **UI data update calls TBD** - no backend integration yet

**🆕**: Documented exact **status indicators** and "no tearing" rule during refresh.

---

## 4. Components & Files

*"The way to get started is to quit talking and begin doing." — Walt Disney*

* `components/ProgressRadial.tsx` (reuse from canvas-checkpoint; adapter if needed)
* `components/StudentToggle.tsx` — buttons labeled with **preferredName**
* `components/ProgressTable.tsx` — aggregated view
* `components/WeeklyGrid.tsx` — weekly assignments table with precise rules
* `components/DetailTable.tsx` — big filterable grid (simple HTML table + small utils)
* `components/Settings/*` — Student & Course metadata forms; Autorefresh modal
* `lib/derive/*` — **pure** helpers (no I/O): status bucketing, aggregates, date/weekday math, percent calculations, week window resolution (Sat/Sun→Monday)
* `lib/auth/rls.ts` — filter student nodes by caller's allowed IDs (from API response)

**🆕**: We avoid heavy grid libraries; HTML tables + utilities will pass all requirements and keep bundle slim.

---

## 5. Data Flow & Access Control

*"Trust, but verify." — Ronald Reagan*

* Pages fetch `GET /api/student-data` (RLS already applied server-side). UI **never** "filters" beyond what's returned.
* Student selector lists only authorized students.
* Settings writes only to `metaData` endpoints; refresh calls only toggle and fire actions—not schema.

---

## 6. Performance & Resilience

*"The secret of getting ahead is getting started." — Mark Twain*

* Render from already-persisted `studentData`.
* Refresh actions are non-blocking; when complete, UI refetches and swaps.
* Avoid N+1 calls from the UI; rely on consolidated backend endpoints already in place.

**Performance Optimization Strategy:**
* **Memoized calculations** for chart data and table aggregations
* **Virtual scrolling** for large assignment lists (if needed)
* **Lazy loading** of chart components
* **Debounced search** for filter inputs
* **Optimized re-renders** using React.memo for expensive components

---

## 7. Testing (TDD plan)

*"The only way to do great work is to love what you do." — Steve Jobs*

**Unit (pure helpers)**

* Status bucketing: inputs covering edge cases (late thresholds, on-time vs submitted vs graded).
* Turned-in %: earned/lost/submitted/possible math.
* Week resolution: Sat/Sun map to Monday; "≤1 weekday late" logic around Fri→Mon boundary.
* **Assignment label formatting** by column type
* **Font size scaling** based on point values
* **Chart data aggregation** and course ordering

**Component tests**

* ProgressRadial: layers add up; hover panel content.
* WeeklyGrid:

  * Correct column highlight for "current day" including weekend.
  * Emoji, color, highlight, size rules per status and points threshold.
  * Link text formats per column.
  * **Assignment label formatting** for each column type
* Student Progress table: order is Period, groups in exact sequence (Missing, Submitted, Submitted On Time, Graded), percentages computed as specified.
* **Chart ordering** by course period
* **Vector assignment exclusion** from progress and assigned views

**Integration (page)**

* Settings: edits persist to `metaData`; Student labels update.
* Refresh menu: spinner and timer icons show/hide correctly; old data kept visible during refresh; new data appears post-swap.
* RLS: attempting to navigate to a student not in the allowed list results in UI fallback to authorized default.

**Accessibility**

* Tab order in weekly grid; aria-labels on bullets; contrast checks on red/yellow highlights.

**🆕**: These tests explicitly cover every "rule bullet" for the weekly grid and progress grouping from the scope. 

---

## 8. Libraries

*"Less is more." — Ludwig Mies van der Rohe*

* **Auth0**: `@auth0/nextjs-auth0` (already present).
* **UI primitives**: shadcn/ui (buttons, inputs, dialogs), lucide-react (icons).
* **Charts**: ApexCharts + react-apexcharts for custom circular progress charts
* **Tables**: @tanstack/react-table for advanced table functionality
* **UI Components**: @headlessui/react for accessible UI components
* **Utilities**: tiny date helpers (own code) instead of pulling a large date lib.

**Complex Data Processing Utilities Assessment:**
* **Date/Time Utilities**: Pacific timezone conversion, weekend-to-Monday mapping, "previous weekday" calculation
* **Chart Data Processing**: Course aggregation, status bucketing, percentage calculations
* **Assignment Processing**: Label formatting by column, font size scaling, status filtering
* **Status Logic**: Vector assignment exclusion, status priority ordering
* **These are necessary** for the UI to function correctly and should be included.

---

## 9. File Inventory (skeleton)

* `app/(protected)/progress/page.tsx` (server)
* `app/(protected)/assignments/page.tsx` (server)
* `app/(protected)/detail/page.tsx` (server)
* `app/(protected)/settings/page.tsx` (server)
* `components/ProgressHeader.tsx` (wraps ProgressRadial + header)
* `components/WeeklyGrid.tsx`
* `components/ProgressTable.tsx`
* `components/DetailTable.tsx`
* `components/Settings/*`
* `lib/derive/*` (pure)

---

## 10. Open Questions / Future Notes

*"The future belongs to those who believe in the beauty of their dreams." — Eleanor Roosevelt*

* **Vector Data Utilization**: Vector assignments are currently excluded from progress and assigned views but kept in the data structure. Future screens may utilize this Vector data for additional functionality or reporting.
* **UI Data Modification**: A small number of cases will allow users to modify student data and metadata directly through the UI. These modifications should be consistent across all data editing interfaces and will require backend integration for persistence.
* **Quick Update Deltas**: We may add quick-update deltas post-MVP; UI won't change—only backend freshness.
* **Performance Optimizations**: Virtualized detail table and other performance enhancements if needed as the dataset grows.

---

That's it. Ship with this. If you want a one-pager for your desk: "No schema changes; compute on read; mimic canvas-checkpoint visuals exactly; obey all weekly-grid rules; show refresh status non-destructively; test the date math like hawks."

**(Scope reference)** The behaviors above are taken directly from the "Checkpoint scope.txt" you were given (pages, metadata editing, refresh behaviors, student select, chart semantics, progress/assignments/detail rules).
