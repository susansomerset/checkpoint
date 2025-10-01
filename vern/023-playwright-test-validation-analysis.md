# Playwright Test Validation Analysis
## Date: October 1, 2025

Comprehensive validation of ALL Playwright tests against current page implementations.

---

## Current Page Structure (as of Assignments-complete)

### `/assignments` page
**Renders:** WeeklyGrid component only
- **Student header:** `"Alice — ⚠️:2 / ❓:0 / 👍:2 / ✅:0"` (NOT "Assignments for Alice")
- **Table with 9 columns:** Class Name, Prior Weeks, Mon (M/d), Tue, Wed, Thu, Fri, Next Week, No Date
- **No h2 heading** with "Assignments for" text
- **No assignment count** or "Assignments for" anywhere

### `/progress` page
**Renders:** ProgressTable component
- **Table with columns:** Class Name, Points Graded, Points Possible, Graded %
- **Course rows:** "Course Name - Teacher (X assignments)" format
- **Expandable:** Courses expand to show status groups, which expand to show assignments
- **No "Assignments for" text**

### Global Layout (header)
- **Student selector:** Shows "Student:" label with student buttons
- **Radial charts:** Above nav tabs
- **Nav tabs:** Progress, Assignments, Detail, Settings
- **No page-specific headings** in layout

---

## Test File Analysis

### ✅ PASSING (Should work as-is)

#### 1. `/tests/smoke/core-functionality.spec.ts`
**Status:** SHOULD PASS
- **Looks for:** 'Student:', 'Sign in required', generic page loading
- **No outdated selectors:** All expectations are generic (body visible, no 404, no console errors)
- **Validates:** Homepage, auth flow, progress page charts, all sub-pages

#### 2. `/tests/phase-2/auth.me.spec.ts`
**Status:** SHOULD PASS
- **Tests:** API endpoints only (`/api/auth/me`, `/api/auth/login`)
- **No page content validation:** Just status codes and redirects
- **No outdated selectors**

#### 3. `/tests/phase-2/student-selector.spec.ts`
**Status:** SHOULD PASS
- **Line 54:** `text=Student:` ✅ (still in layout)
- **Line 57:** Student buttons with CSS classes ✅ (still rendered)
- **Line 74-83:** Click student buttons, check active state ✅
- **Line 115-125:** Display student info ✅
- **Line 149-157:** Navigate and check student persists ✅
- **No "Assignments for" text expected**

#### 4. `/tests/phase-3/radial-charts.spec.ts`
**Status:** SHOULD PASS
- **Tests:** /harness/radials and /progress pages
- **Looks for:** `.font-extrabold` (chart center text) and percentage patterns
- **No assignment page dependencies**
- **No outdated selectors**

#### 5. `/tests/phase-4/student-progress-table.spec.ts`
**Status:** SHOULD PASS (placeholder)
- **Just returns true:** No actual tests yet

#### 6. `/tests/phase-4/progress-table-e2e.spec.ts`
**Status:** SHOULD PASS
- **Tests:** `/progress` page only
- **Looks for:** `[data-testid="progress-table"]`, column headers, course rows
- **No "Assignments for" text**
- **Validates:** Expand/collapse, sorting, all status types

#### 7. `/tests/phase-4/progress-table-visual.spec.ts`
**Status:** SHOULD PASS
- **Visual regression:** Screenshots of `/progress` page states
- **No text selectors** that could be outdated

#### 8. `/tests/spec/page.Assignments/e2e.spec.ts`
**Status:** SHOULD PASS
- **Tests:** `/assignments` page with NEW WeeklyGrid
- **Looks for:** `table`, `th:has-text("Prior Weeks")`, `th:has-text("Mon")`
- **All current selectors:** Written for new WeeklyGrid component

#### 9. `/tests/spec/ui.WeeklyGrid/visual.spec.ts`
**Status:** SHOULD PASS
- **Visual regression:** Screenshots of WeeklyGrid component
- **No text selectors**

#### 10. `/tests/e2e/accessibility.spec.ts`
**Status:** MIXED - One test needs fixing
- **Test 1 (progress axe):** ✅ SHOULD PASS - tests `/progress` page accessibility
- **Test 2 (keyboard nav):** ✅ SHOULD PASS - tests tab navigation on `/progress`
- **Test 3 (ARIA labels):** ❌ NEEDS FIX
  - **Line 57:** Expects 5 headers, but ProgressTable only has **4 headers** now
  - **Fix:** Change `toHaveCount(5)` → `toHaveCount(4)`

---

## ❌ FAILING (Need fixes)

### 11. `/tests/phase-2/assignment-list-integration.spec.ts`
**Status:** ALL 5 TESTS FAILING
**Root cause:** Tests expect OLD assignment list page with "Assignments for [Student]" header

**Current reality:** `/assignments` now renders WeeklyGrid with NO "Assignments for" text

**Failures:**
- **Line 57, 71, 100, 124, 164:** All wait for `'text=Assignments for'` which doesn't exist
- **Line 60, 74, 89:** All look for `h2[class*="text-2xl font-bold text-gray-800"]` which doesn't exist
- **Line 65:** Expects header text to match `/Assignments for .+/` - doesn't exist

**Fix options:**
- **Option A:** Rewrite tests for WeeklyGrid layout (update selectors to match student header format)
- **Option B:** Skip/disable these tests (they test deprecated UI)
- **Option C:** Move to legacy folder and mark as deprecated

**Recommended:** **Option C** - these tests validated Phase 2 functionality that's been replaced by WeeklyGrid (spec-driven Phase 5)

### 12. `/tests/e2e/app.spec.ts`
**Status:** FAILING
**Root cause:** Tests expect page heading and description that don't exist

**Current reality:** `/assignments` has NO heading, NO description - just WeeklyGrid table

**Failures:**
- **Line 6:** `getByRole('heading', { name: 'Assignments' })` - NO heading exists
- **Line 7:** `getByText('View all assignments with Canvas links...')` - NO description exists

**Fix options:**
- **Option A:** Update test to check for WeeklyGrid table instead
- **Option B:** Skip test (deprecated expectations)

**Recommended:** **Option A** - simple update:
```typescript
test('assignments render (mocked auth)', async ({ page }) => {
  await page.goto('/assignments');
  // Check that WeeklyGrid renders
  await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  // Check for WeeklyGrid headers
  await expect(page.locator('th:has-text("Prior Weeks")')).toBeVisible();
  // Check that the student selector is in the header
  await expect(page.locator('header')).toBeVisible();
});
```

---

## Summary

### ✅ Tests that SHOULD PASS (10 files, ~70+ tests):
1. `tests/smoke/core-functionality.spec.ts` - Generic smoke tests
2. `tests/phase-2/auth.me.spec.ts` - API endpoint tests
3. `tests/phase-2/student-selector.spec.ts` - Student selector UI (still exists in header)
4. `tests/phase-3/radial-charts.spec.ts` - Radial charts on harness/progress pages
5. `tests/phase-4/student-progress-table.spec.ts` - Placeholder only
6. `tests/phase-4/progress-table-e2e.spec.ts` - Progress table tests
7. `tests/phase-4/progress-table-visual.spec.ts` - Visual regression
8. `tests/spec/page.Assignments/e2e.spec.ts` - NEW WeeklyGrid tests
9. `tests/spec/ui.WeeklyGrid/visual.spec.ts` - Visual regression
10. `tests/e2e/accessibility.spec.ts` - MOSTLY (2/3 tests pass)

### ❌ Tests that NEED FIXES (2 files, ~6 tests):
1. **`tests/phase-2/assignment-list-integration.spec.ts`** (5 tests)
   - All fail looking for "Assignments for" text
   - **Recommended:** Move to `tests/legacy/` and mark as deprecated
   
2. **`tests/e2e/app.spec.ts`** (1 test)
   - Fails looking for heading and description
   - **Recommended:** Update to check for WeeklyGrid table instead

3. **`tests/e2e/accessibility.spec.ts`** (1 of 3 tests)
   - Line 57: expects 5 headers, should be 4
   - **Recommended:** Change `toHaveCount(5)` → `toHaveCount(4)`

---

## Proposed Fixes

### Immediate (to unblock push):

**File 1:** `tests/e2e/app.spec.ts`
```typescript
test('assignments render (mocked auth)', async ({ page }) => {
  await page.goto('/assignments');
  // Check that WeeklyGrid table renders
  await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  // Check for WeeklyGrid column headers
  await expect(page.locator('th:has-text("Prior Weeks")')).toBeVisible();
  // Check that the student selector is in the header
  await expect(page.locator('header')).toBeVisible();
});
```

**File 2:** `tests/e2e/accessibility.spec.ts` - Line 57
```typescript
await expect(headers).toHaveCount(4); // Class Name, Points Graded, Points Possible, Graded %
```

**File 3:** `tests/phase-2/assignment-list-integration.spec.ts`
- Move entire file to `tests/legacy/phase-2/assignment-list-integration.spec.ts`
- Add comment header: "DEPRECATED: Tests old assignment list UI, replaced by WeeklyGrid in Phase 5"
- Exclude from CI: update `test-phase.js` to skip `tests/legacy/`

### Future (Phase 5+ cleanup):
- Remove deprecated tests entirely once WeeklyGrid is fully validated
- Add comprehensive WeeklyGrid E2E tests in `tests/spec/`

---

## Testing Strategy After Fixes

With these 3 fixes:
- **Expected passing:** ~70 tests across 10 files
- **Expected skipped:** 5 tests in legacy folder
- **CI should:** ✅ GREEN



