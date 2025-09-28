# Letter to Vern: Phase 2 UAT Readiness Plan

**Date**: September 27, 2025  
**From**: Chuckles  
**To**: Vern  
**Subject**: Phase 2 UAT Readiness - Missing Items & Completion Plan

---

## Current Status Summary

Vern, I've completed a thorough review of Phase 2 against the delivery plan. The vertical slice is **~70% complete** but has several blocking items preventing UAT readiness.

**✅ What's Working:**
- `/assignments` page loads with real data
- Authentication flow works (signed in as Chuckles Somerset)
- Assignment list displays correctly with Canvas links
- Error boundary catches failures
- Loading states prevent UI confusion
- Data contracts handle real API responses
- No console errors with real data

**❌ Critical Gaps:**
1. **Jest Config Bug**: `moduleNameMapping` should be `moduleNameMapper` (causing test warnings)
2. **Bundle Size Monitoring**: `size-limit` package not installed/configured
3. **Student Selection**: No dropdown to switch between students
4. **MSW Infrastructure**: API mocking handlers missing (ES module issues)
5. **E2E Test Coverage**: Only 1/3 Playwright tests passing (macOS compatibility)
6. **Size Budget Verification**: Can't verify 250KB gzip budget

## Proposed Completion Plan

### Phase 2A: Critical Fixes (30 minutes)
1. **Fix Jest Config**: Change `moduleNameMapping` → `moduleNameMapper` in `jest.config.js`
2. **Install Size-Limit**: `npm install --save-dev size-limit @size-limit/preset-big-lib`
3. **Configure Bundle Monitoring**: Add size-limit script to `package.json`
4. **Verify Bundle Budget**: Run size-limit check to confirm <250KB gzip

### Phase 2B: Student Selection (45 minutes)
1. **Create StudentSelector Component**: Dropdown with student names from metadata
2. **Add to Assignments Page**: Integrate selector above assignment list
3. **URL State Sync**: Persist selected student in URL params
4. **Test Student Switching**: Verify data updates when switching students

### Phase 2C: Testing Infrastructure (60 minutes)
1. **Fix Playwright Compatibility**: Update to latest version or use alternative browser
2. **Create MSW Handlers**: Mock `/api/student-data` responses (simplified version)
3. **Add Integration Tests**: Test complete data flow with mocked data
4. **Run Full Test Suite**: Ensure 100% pass rate

### Phase 2D: Final Validation (15 minutes)
1. **Manual UAT Checklist**: Walk through all user scenarios
2. **Performance Check**: Verify bundle size and load times
3. **Error Scenarios**: Test network failures, empty data, malformed responses
4. **Accessibility Check**: Basic keyboard navigation and screen reader support

## Questions for Your Input

1. **Priority**: Should I focus on the critical fixes first, or is student selection more important for UAT?

2. **MSW Strategy**: Given the ES module issues, should I:
   - Create simplified MSW handlers that work with current Jest setup?
   - Skip MSW for now and rely on real API testing?
   - Use a different mocking strategy?

3. **Playwright Approach**: For the macOS compatibility issues, should I:
   - Update Playwright to latest version?
   - Use a different browser (Firefox/Safari)?
   - Focus on manual testing for now?

4. **Bundle Budget**: The 250KB gzip budget seems aggressive for a Next.js app with Auth0. Should I:
   - Keep the 250KB target and optimize aggressively?
   - Adjust the budget based on current baseline?
   - Focus on route-level splitting instead?

5. **UAT Scope**: For Phase 2 UAT, what's the minimum viable scope?
   - Just the assignments page with real data?
   - Include student selection and URL state?
   - Full error handling and edge cases?

## Estimated Timeline

- **Phase 2A**: 30 minutes (critical fixes)
- **Phase 2B**: 45 minutes (student selection)
- **Phase 2C**: 60 minutes (testing infrastructure)
- **Phase 2D**: 15 minutes (final validation)

**Total**: ~2.5 hours to UAT readiness

## Risk Assessment

**Low Risk**: Jest config fix, size-limit installation, student selector component  
**Medium Risk**: Playwright compatibility, MSW ES module issues  
**High Risk**: Bundle size optimization if current baseline exceeds 250KB

## Recommendation

I recommend proceeding with **Phase 2A** immediately (critical fixes), then waiting for your guidance on the remaining items. The current implementation is solid and functional - we just need to address the infrastructure gaps to meet the delivery plan requirements.

The vertical slice proves the architecture works with real data, which was the primary goal of Phase 2. The remaining items are mostly polish and testing infrastructure.

**What's your preference on the approach and priorities?**

---

*Chuckles*  
*Phase 2 Implementation Lead*
