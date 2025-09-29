# Test Organization by Phase

This directory is organized to match the phase-based delivery plan in `DELIVERY_PLAN.md`. Each phase has its own test directory with tests that validate the success criteria for that phase.

## Phase 1: Foundation & Setup ✅
**Location:** `tests/phase-1/`
**Success Criteria:**
- All utility functions pass 100% test coverage
- Data contracts are versioned and documented
- MSW handlers mirror real API responses
- Timezone logic handles DST transitions correctly
- Sentry integration working

**Tests:**
- `timezone.test.ts` - Timezone utility functions
- `sentry.test.ts` - Error reporting integration
- `handlers.test.ts` - MSW API mocking
- `canvasLinks.test.ts` - Canvas URL generation utilities

## Phase 2: Vertical Slice ✅
**Location:** `tests/phase-2/`
**Success Criteria:**
- Real data loads and displays correctly
- All Canvas links work
- Loading states prevent confusion
- Error states are user-friendly
- Student selection works

**Tests:**
- `assignment-list-integration.spec.ts` - End-to-end assignment display
- `student-selector.spec.ts` - Student selection functionality
- `auth.me.spec.ts` - Authentication flow

## Phase 3: Progress Header ✅
**Location:** `tests/phase-3/`
**Success Criteria:**
- Chart renders client-side only (no hydration errors)
- All four layers display correctly with associative totals
- Hover tooltip shows accurate data
- Center shows percentage or checkmark appropriately
- Courses ordered by period (with consistent tie-breakers)

**Tests:**
- `radial-charts.spec.ts` - Visual regression and accessibility tests
- `radial-charts.spec.ts-snapshots/` - Visual baseline snapshots

## Phase 4: Student Progress Table (Pending)
**Location:** `tests/phase-4/`
**Success Criteria:**
- Courses ordered by period
- Status subgroups in correct order
- All assignments link to Canvas
- Expand/collapse works smoothly
- Student filtering works correctly
- Vector assignments hidden

**Tests:**
- `student-progress-table.spec.ts` - (Placeholder)

## Phase 5: Weekly Grid (Pending)
**Location:** `tests/phase-5/`
**Success Criteria:**
- All date logic works in Pacific timezone
- Weekend assignments map to Monday
- Late logic handles Fri→Mon correctly
- All rendering rules implemented exactly
- Current day highlighted correctly
- All assignments link to Canvas

**Tests:**
- `weekly-grid.spec.ts` - (Placeholder)

## Phase 6: Detail Table (Pending)
**Location:** `tests/phase-6/`
**Success Criteria:**
- All assignment fields displayed
- Filtering works correctly
- Sorting works on all columns
- Pagination handles large datasets
- All links work correctly
- Table is accessible

**Tests:**
- `detail-table.spec.ts` - (Placeholder)

## Phase 7: Settings & Metadata (Pending)
**Location:** `tests/phase-7/`
**Success Criteria:**
- Modal opens/closes correctly
- All metadata can be edited
- Changes persist correctly
- Autorefresh controls work
- Visual indicators show status
- Form validation works

**Tests:**
- `settings-metadata.spec.ts` - (Placeholder)

## Phase 8: Integration & Polish (Pending)
**Location:** `tests/phase-8/`
**Success Criteria:**
- All pages render correctly
- Navigation works smoothly
- Error states are user-friendly
- Loading states prevent confusion
- Accessibility standards met
- Performance targets achieved

**Tests:**
- `integration-polish.spec.ts` - (Placeholder)

## Running Tests by Phase

### Phase-Based Testing Strategy

**CRITICAL:** The smoke test runs FIRST and MUST pass before any other tests run.

1. **Smoke Test** (`tests/smoke.spec.ts`) - Runs first, stops everything if it fails
2. **Target Phase Tests** - Run the specific phase being tested
3. **All Previous Phases** - Run all completed phases in order
4. **Stop on Failure** - If any test fails, stop immediately

### Commands

```bash
# Run all tests (smoke + all phases in order) - RECOMMENDED
node scripts/test-phase.js

# Run tests for a specific phase
node scripts/test-phase.js phase-1
node scripts/test-phase.js phase-2
node scripts/test-phase.js phase-3

# Run smoke test only
npx playwright test tests/smoke.spec.ts

# Run all tests (not recommended - use phase-based testing)
npx playwright test

# Run unit tests (Jest)
npm test
```

### Test Dependencies

- **Phase 1** tests can run independently
- **Phase 2** tests require Phase 1 to pass
- **Phase 3** tests require Phase 1 + Phase 2 to pass
- And so on...

This ensures that each phase builds on the previous phases and nothing breaks.

## Test Data

- `fixtures/` - Mock data and test fixtures (shared across phases)
- `phase-2/real-data*` - Real data cache and mock data generators (Phase 2 specific)

## Notes

- Each phase's tests validate the specific success criteria for that phase
- Tests are written to be independent and can run in any order
- Visual regression tests use deterministic snapshots
- All tests include accessibility checks where applicable
