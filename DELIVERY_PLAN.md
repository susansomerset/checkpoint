# Canvas Checkpoint Frontend Delivery Plan

*"The best way to eat an elephant is one bite at a time."*

A comprehensive, phase-based delivery plan for building the Canvas Checkpoint frontend with automated testing and clear success criteria.

---

## Table of Contents

1. [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
2. [Phase 2: Vertical Slice (End-to-End Foundation)](#phase-2-vertical-slice-end-to-end-foundation)
3. [Phase 3: Progress Header](#phase-3-progress-header)
4. [Phase 4: Student Progress Table](#phase-4-student-progress-table)
5. [Phase 5: Weekly Grid](#phase-5-weekly-grid)
6. [Phase 6: Detail Table](#phase-6-detail-table)
7. [Phase 7: Settings & Metadata](#phase-7-settings--metadata)
8. [Phase 8: Integration & Polish](#phase-8-integration--polish)
9. [Testing Strategy](#testing-strategy)
10. [Success Metrics](#success-metrics)

---

## Phase 1: Foundation & Setup

*"Measure twice, cut once."*

### Deliverables
- [ ] Project structure and dependencies
- [ ] Data contracts and type definitions
- [ ] Core utility functions (pure helpers)
- [ ] Test infrastructure setup
- [ ] MSW handlers and mocks
- [ ] Observability setup

### Tasks
1. **Setup Dependencies**
   - Install required packages: `apexcharts`, `react-apexcharts`, `@headlessui/react`
   - Install testing: `@testing-library/jest-dom`, `msw`, `@storybook/react` (if using Chromatic)
   - Install observability: `@sentry/nextjs`
   - Configure TypeScript paths for `@/components`, `@/lib`
   - Setup Jest + React Testing Library + Playwright

2. **Define Data Contracts** (`lib/contracts/`)
   - `types.ts` - Core types: `Student`, `Course`, `Assignment`, `Submission`, `DerivedAssignment`
   - `api.ts` - API response types with versioning (`apiVersion: 1`)
   - `mocks.ts` - MSW handlers mirroring `/api/student-data` responses
   - Version contracts: breaking changes bump `apiVersion`

3. **Create Status Logic Module** (`lib/status/`)
   - `statusResolver.ts` - Pure status determination logic
   - `statusBuckets.ts` - Status grouping and ordering
   - `vectorFilter.ts` - Vector assignment filtering predicate
   - Comprehensive unit tests with fixtures
   - Isolated from UI concerns

4. **Create Core Utilities** (`lib/derive/`)
   - `courseAggregates.ts` - Course-level calculations
   - `turnedInPct.ts` - Turned-in percentage calculations
   - `weekWindow.ts` - Timezone-aware date/weekday logic (configurable TZ)
   - `labels.ts` - Column-specific label formatting
   - `pointsSizing.ts` - Font size rules by point value
   - `canvasLinks.ts` - Centralized Canvas link generation

5. **Setup Observability**
   - Sentry integration for error reporting
   - Client logger for fetch timings, pagination counts, rate limits
   - Dev health panel: last refresh, counts, errors

6. **Create Test Fixtures**
   - **Use real data from `/api/student-data`** for comprehensive testing
   - Generate MSW handlers from real API responses
   - Create synthetic data only for error scenarios we can't reproduce
   - Ensure real data covers edge cases: weekend boundaries, late assignments, Vector types, DST transitions

### Testing
- **Unit Tests**: All utility functions with edge cases
- **Contract Tests**: Type compilation, MSW fixture validation
- **Integration Tests**: Utility function combinations
- **Manual Tests**: Verify timezone handling, DST edge cases

### Success Criteria
- [ ] All utility functions pass 100% test coverage
- [ ] Status logic module is isolated and well-tested
- [ ] Data contracts are versioned and documented
- [ ] MSW handlers mirror real API responses
- [ ] Timezone logic handles DST transitions correctly
- [ ] Test fixtures use real data from `/api/student-data`
- [ ] No TypeScript errors
- [ ] Sentry integration working
- [ ] **Contract test stop rule**: Real Canvas data passes contract type-checks
- [ ] **Graceful degradation**: Missing fields log + skip, don't crash

---

## Phase 2: Vertical Slice (End-to-End Foundation)

*"A journey of a thousand miles begins with a single step."*

### Deliverables
- [ ] Basic assignment list view
- [ ] Real API integration
- [ ] Loading and error states
- [ ] Canvas link functionality
- [ ] Data contract validation

### Tasks
1. **Create Basic Assignment List**
   - Simple HTML table showing assignments
   - Student selection dropdown
   - Status display with basic styling
   - Canvas links for each assignment

2. **Implement Real API Integration**
   - Fetch from `/api/student-data` endpoint
   - Handle RLS filtering
   - Process real data through contracts
   - Validate data contract compliance

3. **Add Essential UI States**
   - Loading skeleton while fetching
   - Error boundary with retry
   - Empty state when no assignments
   - Toast notifications for errors

4. **Implement Basic Navigation**
   - Student selection persistence
   - URL state management
   - Basic routing structure

### Testing
- **E2E Tests**: Complete data flow from API to UI
- **Contract Tests**: Real API responses match expected types
- **Error Tests**: Network failures, empty responses, malformed data
- **Manual Tests**: Real data loading and display

### Success Criteria
- [ ] Real data loads and displays correctly
- [ ] All Canvas links work
- [ ] Loading states prevent confusion
- [ ] Error states are user-friendly
- [ ] Student selection works
- [ ] Data contracts are validated
- [ ] No console errors with real data

### Phase 0.5 Implementation Checklist

*"A journey of a thousand miles begins with a single step."*

#### Routes & Pages
- [ ] Create `/assignments` route with basic layout
- [ ] Add student selection dropdown (preferred names from metadata)
- [ ] Implement URL state sync for selected student

#### API Integration
- [ ] Create `lib/api/studentData.ts` with fetch wrapper
- [ ] Add error handling for network failures
- [ ] Implement retry logic with exponential backoff
- [ ] Add loading states during fetch

#### MSW Handlers
- [ ] Mock `/api/student-data` endpoint
- [ ] Mock `/api/metadata` endpoint
- [ ] Add error scenarios (network failure, 403, 500)
- [ ] Create fixtures with realistic data

#### Error Boundary
- [ ] Create `components/ErrorBoundary.tsx`
- [ ] Add Sentry integration (gated by env)
- [ ] Implement PII scrubbing in beforeSend
- [ ] Add friendly error message with retry button

#### Basic Assignment List
- [ ] Create `components/AssignmentList.tsx`
- [ ] Display: course name, assignment title, status, due date
- [ ] Add Canvas links with `rel="noopener noreferrer"`
- [ ] Implement basic styling (status colors)

#### Loading & Empty States
- [ ] Add skeleton loading for assignment list
- [ ] Create empty state when no assignments
- [ ] Add error state with retry functionality
- [ ] Implement toast notifications for errors

#### Bundle Size Monitoring
- [ ] Add `size-limit` package
- [ ] Configure size-limit script in package.json
- [ ] Set initial budget: 250KB (gzip)
- [ ] Add CI check for bundle size

#### Testing
- [ ] E2E test: complete data flow
- [ ] Component test: error boundary behavior
- [ ] Integration test: MSW handlers work
- [ ] Manual test: real data loading

#### Definition of Done
- [ ] Real data loads without errors
- [ ] All Canvas links open correctly
- [ ] Error boundary catches and reports failures
- [ ] Loading states prevent UI confusion
- [ ] Bundle size under 250KB (gzip)
- [ ] All tests pass
- [ ] No console errors or warnings

---

## Phase 3: Progress Header

*"A picture is worth a thousand words."*

### Deliverables
- [ ] `ProgressRadial` component (client-only)
- [ ] `ProgressHeader` wrapper component
- [ ] Chart data derivation logic
- [ ] Hover tooltip functionality

### Tasks
1. **Create ProgressRadial Component**
   - Dynamic import with SSR disabled
   - Four-layer radial chart (Earned/Submitted/Missing/Lost)
   - Center percentage/checkmark display
   - Hover tooltip with detailed breakdown
   - Screen reader summary (`aria-live` region)
   - Keyboard navigation support

2. **Implement Chart Data Logic**
   - Course aggregation by period (with tie-breakers)
   - Status bucket calculations using status module
   - Turned-in percentage computation (associative totals)
   - Vector assignment filtering via predicate

3. **Add ProgressHeader Wrapper**
   - Student selection integration
   - Course/teacher labels
   - Responsive layout
   - Error boundary integration
   - Loading skeleton

4. **Add Bundle Optimization**
   - Code splitting for chart components
   - Bundle size monitoring
   - Fallback SVG radial chart (if needed)

### Testing
- **Unit Tests**: Chart data calculations, status module integration
- **Component Tests**: Chart rendering, hover states, error boundaries
- **Visual Tests**: Chart appearance matches design
- **Accessibility Tests**: ARIA labels, keyboard navigation, screen reader
- **Performance Tests**: Bundle size, chart load time
- **Error Tests**: Network failures, malformed data

### Success Criteria
- [ ] Chart renders client-side only (no hydration errors)
- [ ] All four layers display correctly with associative totals
- [ ] Hover tooltip shows accurate data
- [ ] Center shows percentage or checkmark appropriately
- [ ] Courses ordered by period (with consistent tie-breakers)
- [ ] Vector assignments excluded via predicate
- [ ] Screen reader announces chart data
- [ ] Keyboard navigation works
- [ ] Error boundary catches failures gracefully
- [ ] Bundle size within budget (or fallback ready)
- [ ] Performance gate: Lighthouse TTI >90
- [ ] Accessibility gate: axe passes, keyboard demo

---

## Phase 4: Student Progress Table

*"The devil is in the details."*

### Deliverables
- [ ] `ProgressTable` component
- [ ] Collapsible course sections
- [ ] Status subgroup organization
- [ ] Canvas assignment links

### Tasks
1. **Create ProgressTable Component**
   - Course grouping by period
   - Status subgroups: Missing → Submitted → Submitted (On time) → Graded
   - Collapsible/expandable sections
   - Assignment count and percentage displays

2. **Implement Status Logic**
   - Correct status ordering
   - Vector assignment filtering
   - Due date formatting
   - Canvas link generation

3. **Add Interactive Features**
   - Expand/collapse functionality
   - Student selection filtering
   - Responsive table layout

### Testing
- **Unit Tests**: Status grouping logic
- **Component Tests**: Expand/collapse behavior
- **Integration Tests**: Student filtering
- **Visual Tests**: Table layout and styling

### Success Criteria
- [ ] Courses ordered by period
- [ ] Status subgroups in correct order
- [ ] All assignments link to Canvas
- [ ] Expand/collapse works smoothly
- [ ] Student filtering works correctly
- [ ] Vector assignments hidden

---

## Phase 5: Weekly Grid

*"Time is of the essence."*

### Deliverables
- [ ] `WeeklyGrid` component
- [ ] Pacific timezone date logic
- [ ] Rendering rules implementation
- [ ] Column-specific formatting

### Tasks
1. **Create WeeklyGrid Component**
   - Row/column structure
   - Current day highlighting
   - Assignment placement logic
   - Responsive grid layout

2. **Implement Date Logic**
   - Pacific timezone handling
   - Weekend → Monday mapping
   - "≤1 weekday late" calculation
   - Previous weekday logic

3. **Add Rendering Rules**
   - Emoji bullets by status
   - Color coding (red/yellow/blue/green)
   - Font sizing by points
   - Column-specific label formats

### Testing
- **Unit Tests**: Date logic with edge cases
- **Component Tests**: Rendering rules
- **Visual Tests**: Grid appearance
- **Accessibility Tests**: Tab order, ARIA labels

### Success Criteria
- [ ] All date logic works in Pacific timezone
- [ ] Weekend assignments map to Monday
- [ ] Late logic handles Fri→Mon correctly
- [ ] All rendering rules implemented exactly
- [ ] Current day highlighted correctly
- [ ] All assignments link to Canvas

---

## Phase 6: Detail Table

*"The kitchen sink approach."*

### Deliverables
- [ ] `DetailTable` component
- [ ] HTML table with utilities
- [ ] Filtering and sorting
- [ ] Pagination (if needed)

### Tasks
1. **Create DetailTable Component**
   - All assignment fields displayed
   - Course information columns
   - Submission details
   - Canvas links

2. **Implement Table Features**
   - Global search
   - Column filtering
   - Sorting capabilities
   - Responsive design

3. **Add Pagination** (if needed)
   - Client-side pagination
   - Page size controls
   - Navigation controls

### Testing
- **Unit Tests**: Filtering/sorting logic
- **Component Tests**: Table interactions
- **Performance Tests**: Large dataset handling
- **Accessibility Tests**: Table navigation

### Success Criteria
- [ ] All assignment fields displayed
- [ ] Filtering works correctly
- [ ] Sorting works on all columns
- [ ] Pagination handles large datasets
- [ ] All links work correctly
- [ ] Table is accessible

---

## Phase 7: Settings & Metadata

*"Settings the record straight."*

### Deliverables
- [ ] `Settings` modal component (read-only first)
- [ ] Student metadata editing (per-field)
- [ ] Course metadata editing (per-field)
- [ ] Autorefresh controls
- [ ] Undo/revert functionality

### Tasks
1. **Create Settings Modal (Read-Only)**
   - Headless UI Dialog
   - Tab navigation (Student/Course metadata)
   - Display current values
   - Basic navigation

2. **Implement Per-Field Editing**
   - Single-field edit mode
   - Form validation per field
   - Optimistic UI updates
   - Persistence with error handling

3. **Add Data Persistence**
   - API integration for metadata updates
   - Error handling and rollback
   - Success feedback
   - **Simple undo/revert**: last-saved snapshot + rollback (no diff-tracking)

4. **Add Autorefresh Controls**
   - Full refresh toggle
   - Quick update cadence (0-60 minutes)
   - Visual indicators (spinner, timer)
   - Last updated display from `lastLoadedAt`

5. **Add Bulk Operations** (if needed)
   - Multi-field editing
   - Bulk save/cancel
   - Progress indicators

### Testing
- **Unit Tests**: Form validation
- **Component Tests**: Modal behavior
- **Integration Tests**: Data persistence
- **E2E Tests**: Complete settings workflow

### Success Criteria
- [ ] Modal opens/closes correctly
- [ ] All metadata can be edited
- [ ] Changes persist correctly
- [ ] Autorefresh controls work
- [ ] Visual indicators show status
- [ ] Form validation works

---

## Phase 8: Integration & Polish

*"The finishing touches."*

### Deliverables
- [ ] Page routing and navigation
- [ ] Error boundaries
- [ ] Loading states
- [ ] Accessibility improvements
- [ ] Performance optimizations

### Tasks
1. **Create Page Components**
   - Progress page
   - Assignments page
   - Detail page
   - Settings page

2. **Add Error Handling**
   - Error boundaries
   - 404 page
   - Network error handling
   - User-friendly error messages

3. **Implement Loading States**
   - Skeleton screens
   - Loading spinners
   - Progress indicators
   - No-tearing refresh

4. **Add Accessibility Features**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Color contrast compliance

### Testing
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: WCAG compliance
- **Performance Tests**: Lighthouse scores
- **Error Tests**: Error boundary behavior

### Success Criteria
- [ ] All pages render correctly
- [ ] Navigation works smoothly
- [ ] Error states are user-friendly
- [ ] Loading states prevent confusion
- [ ] Accessibility standards met
- [ ] Performance targets achieved

---

## Testing Strategy

*"Trust, but verify."*

### Automated Testing
1. **Unit Tests** (Jest + React Testing Library)
   - All utility functions
   - Component logic
   - Edge cases and error conditions
   - **Coverage gates per PR**: utilities 100%, components 90%+

2. **Component Tests** (React Testing Library)
   - User interactions
   - State changes
   - Props handling

3. **Integration Tests** (Playwright)
   - Page navigation
   - Data flow
   - API interactions

4. **Visual Regression Tests** (Playwright Visual Snapshots)
   - Component appearance
   - Responsive layouts
   - Cross-browser compatibility
   - **Decision**: Use Playwright visual diffs instead of Chromatic (simpler infra)

### Manual Testing
1. **User Acceptance Testing**
   - Complete user workflows
   - Edge case scenarios
   - Performance validation

2. **Accessibility Testing**
   - **Screen reader testing** (VoiceOver/NVDA) in Phase 1-2, not just Phase 6
   - Keyboard navigation
   - Color contrast validation
   - **Charts especially** need early screen reader validation

3. **Cross-Browser Testing**
   - Chrome, Firefox, Safari
   - Mobile devices
   - Different screen sizes

4. **Timezone/DST Testing**
   - **Mar/Nov transition fixtures** (always bite)
   - Pacific timezone edge cases
   - Holiday boundary testing

### Test Data Management
- **Fixtures**: Realistic test data with edge cases
- **Mocks**: API responses and error conditions
- **Snapshots**: Component output verification

## Test Implementation Details

*"The proof is in the pudding."*

### Phase 1 Test Implementation

#### 1. Contract Validation Script
```bash
# scripts/validate-contracts.js
# Run: npm run validate-contracts
```
- **Purpose**: Validate real Canvas data against TypeScript contracts
- **Implementation**: 
  - Fetch sample data from `/api/student-data`
  - Run through Zod schema validation
  - Log missing/extra fields
  - Exit with error if contract violations found
- **Success**: All real data passes contract validation

#### 2. Utility Function Test Suite
```bash
# tests/lib/status/statusResolver.test.ts
# tests/lib/derive/courseAggregates.test.ts
# tests/lib/derive/weekWindow.test.ts
# Run: npm test
```
- **Coverage Target**: 100% for all utility functions
- **Implementation**:
  - Jest + React Testing Library
  - Edge cases: DST transitions, null values, empty arrays
  - **Use real data from `/api/student-data`** for comprehensive testing
- **Success**: All tests pass, coverage = 100%

#### 3. MSW Handler Validation
```bash
# tests/mocks/handlers.test.ts
# Run: npm run test:mocks
```
- **Purpose**: Ensure MSW handlers mirror real API responses
- **Implementation**:
  - **Use real data from `/api/student-data`** to generate MSW fixtures
  - Compare MSW response shape to real API
  - Validate all required fields present
  - Test error scenarios (403, 500, network failure)
- **Success**: MSW responses match real API contract

#### 4. Timezone/DST Test Suite
```bash
# tests/lib/derive/timezone.test.ts
# Run: TZ=America/Los_Angeles npm test timezone
```
- **Purpose**: Validate Pacific timezone logic handles DST transitions
- **Implementation**:
  - Test Mar/Nov DST transitions
  - Test weekend → Monday mapping
  - Test "≤1 weekday late" logic across boundaries
  - Use `TZ=America/Los_Angeles` environment variable
- **Success**: All timezone logic works correctly in Pacific timezone

#### 5. Bundle Size Validation
```bash
# scripts/check-bundle-size.js
# Run: npm run check-bundle-size
```
- **Purpose**: Ensure bundle size stays within budget
- **Implementation**:
  - Use `size-limit` package
  - Check initial route JS ≤ 250KB (gzip)
  - Check total app per route ≤ 400KB (gzip)
  - Fail CI if over budget
- **Success**: Bundle size within targets

#### 6. Sentry Integration Test
```bash
# tests/integration/sentry.test.ts
# Run: npm run test:sentry
```
- **Purpose**: Validate error reporting works correctly
- **Implementation**:
  - Test ErrorBoundary reports to Sentry
  - Test PII scrubbing in beforeSend
  - Test no reporting in dev mode
- **Success**: Errors reported correctly, PII scrubbed

### Phase 2 Test Implementation

#### 1. E2E Data Flow Test
```bash
# tests/e2e/assignment-list.spec.ts
# Run: npm run test:e2e
```
- **Purpose**: Complete data flow from API to UI
- **Implementation**:
  - Playwright test
  - Load real data from `/api/student-data`
  - Verify assignment list displays correctly
  - Verify Canvas links work
- **Success**: Real data loads and displays without errors

#### 2. Error Boundary Test
```bash
# tests/components/ErrorBoundary.test.tsx
# Run: npm test ErrorBoundary
```
- **Purpose**: Verify error boundary catches and handles failures
- **Implementation**:
  - Force component to throw error
  - Verify boundary catches error
  - Verify friendly error message displays
  - Verify retry button works
- **Success**: Error boundary works correctly

#### 3. Loading States Test
```bash
# tests/components/AssignmentList.test.tsx
# Run: npm test AssignmentList
```
- **Purpose**: Verify loading states prevent UI confusion
- **Implementation**:
  - Test skeleton loading during fetch
  - Test empty state when no assignments
  - Test error state with retry
- **Success**: All loading states work correctly

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:mocks": "jest tests/mocks/",
    "validate-contracts": "node scripts/validate-contracts.js",
    "check-bundle-size": "node scripts/check-bundle-size.js",
    "test:sentry": "jest tests/integration/sentry.test.ts",
    "test:timezone": "TZ=America/Los_Angeles jest tests/lib/derive/timezone.test.ts"
  }
}
```

### CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run validate-contracts
      - run: npm run test:coverage
      - run: npm run check-bundle-size
      - run: npm run test:e2e
      - run: npm run test:timezone
```

### Test Data Strategy

```typescript
// tests/fixtures/real-data.ts
// Generate test fixtures from real API data
export const generateTestFixtures = async () => {
  const realData = await fetch('/api/student-data');
  return {
    assignments: realData.assignments,
    courses: realData.courses,
    students: realData.students,
    // Use real data to ensure we test against actual edge cases
  };
};

// tests/fixtures/error-scenarios.ts
// Only create synthetic data for error conditions we can't reproduce
export const errorScenarios = {
  networkFailure: { type: 'NETWORK_ERROR' },
  serverError: { type: 'SERVER_ERROR', status: 500 },
  authError: { type: 'AUTH_ERROR', status: 403 },
  // These are the only synthetic fixtures we need
};
```

---

## Success Metrics

*"What gets measured gets managed."*

### Technical Metrics
- [ ] 100% test coverage for utility functions
- [ ] 90%+ test coverage for components
- [ ] Zero TypeScript errors
- [ ] Lighthouse score >90
- [ ] Bundle size <500KB

### Functional Metrics
- [ ] All rendering rules implemented exactly
- [ ] Pacific timezone logic handles all cases
- [ ] Vector assignments filtered correctly
- [ ] All Canvas links work
- [ ] Settings persist correctly

### User Experience Metrics
- [ ] Page load time <2 seconds
- [ ] Smooth animations and transitions
- [ ] Accessible to screen readers
- [ ] Works on mobile devices
- [ ] Error states are helpful

### Quality Gates
- [ ] All tests pass
- [ ] No console errors
- [ ] Accessibility audit passes
- [ ] Performance audit passes
- [ ] Code review approved

---

## Definitions of Done (Per Phase)

*"What gets measured gets managed."*

### Required Gates for Each Phase
- [ ] **Perf Gate**: Lighthouse TTI >90; chart page JS <X KB after code-split
- [ ] **A11y Gate**: axe passes; keyboard path demo recorded
- [ ] **Error Demo**: Short clip of boundary catching forced failure
- [ ] **Contract Snapshot**: Type tests compile; MSW fixtures pass
- [ ] **Bundle Budget**: Size within target (or fallback implemented)
- [ ] **Test Coverage**: Enforced per PR (utilities 100%, components 90%+)
- [ ] **Graceful Degradation**: Missing fields log + skip, don't crash

### Phase-Specific Gates
- **Phase 1**: All utilities tested; contracts defined; MSW working; **contract test stop rule passed**
- **Phase 2**: Real data loads; Canvas links work; error states handled
- **Phase 3**: Chart renders; screen reader works; bundle optimized
- **Phase 4**: Status ordering correct; Vector filtering works
- **Phase 5**: Date logic handles DST; rendering rules exact
- **Phase 6**: All fields displayed; filtering/sorting works
- **Phase 7**: Metadata persists; undo works; autorefresh shows status
- **Phase 8**: All pages work; errors handled; accessibility passes

### Contract Test Stop Rule (Phase 1)
*"If real Canvas data breaks contract type-checks, plan migration/adapter before any UI work continues."*

- [ ] Real Canvas data passes contract type-checks
- [ ] Missing fields log + skip gracefully (don't crash)
- [ ] API response validation against contracts
- [ ] Graceful degradation for unexpected data shapes

## Phase Dependencies

*"The right order matters."*

```
Phase 1 (Foundation) → Phase 2 (Vertical Slice) → Phase 3 (Progress Header)
Phase 3 → Phase 4 (Student Progress)
Phase 4 → Phase 5 (Weekly Grid)
Phase 5 → Phase 6 (Detail Table)
Phase 6 → Phase 7 (Settings)
Phase 7 → Phase 8 (Integration)
```

Each phase builds on the previous one, with testing gates between phases to ensure quality and prevent regression.

## Risk Mitigation

*"Hope for the best, plan for the worst."*

### High Risk Items
- **Bundle Size**: Monitor ApexCharts impact; have SVG fallback ready
- **Status Logic**: Keep isolated in module; comprehensive tests
- **Timezone/DST**: Extensive edge case testing; configurable TZ
- **Data Drift**: Canvas API fields changing or being null; graceful degradation required

### Medium Risk Items
- **Settings Scope**: Start read-only; add features incrementally
- **Chart Accessibility**: Screen reader support; keyboard navigation
- **Partial Loads**: Graceful degradation; retry mechanisms

### Low Risk Items
- **Basic Tables**: HTML + utilities; well-understood patterns
- **Pagination**: Client-side; standard implementation

## Implementation Decisions (Vern's Guidance)

*"Clear decisions prevent analysis paralysis."*

### Vertical Slice Scope
- **Real list view**: Student → courses → assignments with status + Canvas link
- Include loading, empty, error states
- Proves contracts, pagination, auth, and link building

### Status Logic Package
- **Well-isolated internal module** in `lib/status/`
- Export pure `resolveStatus(assignment, submission, now, course)` and `groupByStatus(...)`
- Treat as "platform primitive" consumed by all views

### Bundle Budget
- **Initial route JS (gzip)**: ≤ 250–300 KB
- **Total app per route (gzip, post-code-split)**: ≤ 400 KB
- **ApexCharts**: Dynamically imported only on chart route
- **Fallback SVG radial**: Plan in backlog, build only if over budget

### MSW Integration
- Mock what frontend consumes: processed `/api/student-data`
- Keep small set of raw Canvas API handlers for data layer tests
- UI tests hit processed contract for stability

### Sentry Integration
- Add now, gated by env (`SENTRY_DSN` present + `NODE_ENV=production`)
- Include ErrorBoundary, network error logging, PII scrubbing
- Local/dev: no reporting, still render boundary

## Vern's Correctness Nits (Implementation Details)

*"The devil is in the details."*

### Critical Implementation Requirements
1. **Progress Header Semantic Ordering**: Ensure four-layer radial has correct semantic ordering (graded vs submitted vs missing vs lost) with associative totals (no double-counting)

2. **Vector Assignment Filter**: Codify as pure predicate with tests, use everywhere (header, table, grid) to prevent drift

3. **Weekly Grid Late Logic**: Spell out algorithm for Fri→Mon and holiday cases; add comprehensive fixtures

4. **Course Ordering Tie-Breakers**: Define tie-breakers (alpha by short name) so snapshots are stable

5. **Canvas Links Centralization**: Use `linkToAssignment(courseId, assignmentId)` helper everywhere to avoid URL mismatches

### Timezone Configuration
- Default: `TZ_DEFAULT='America/Los_Angeles'` in env/config
- Centralize all date math in one lib with DST edge testing
- Use UTC constructors + explicit conversion

### Bundle Budget Reality
- **Initial route JS (gzip)**: ≤ 250–300 KB
- **Total app per route (gzip, post-code-split)**: ≤ 400 KB
- ApexCharts dynamically imported only on chart route
- Plan lightweight SVG fallback in backlog (build only if over budget)
- Add bundle budget check in CI (size-limit)

### Testing Stack Cohesion
- **Decision**: Use Playwright visual diffs on key screens (no Storybook/Chromatic)
- MSW across unit + E2E (no real Canvas hits)
- **Coverage gates per PR**: utilities 100%, components 90%+

---

*"The best way to predict the future is to create it."*

This delivery plan provides a clear roadmap for building the Canvas Checkpoint frontend with confidence, quality, and maintainability.
