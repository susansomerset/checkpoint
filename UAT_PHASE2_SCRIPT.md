# Phase 2 UAT Script - Vertical Slice

**Date**: September 27, 2025  
**Version**: Phase 2 - Vertical Slice (End-to-End Foundation)  
**Tester**: [Your Name]  
**Environment**: Local Development (http://localhost:3000)

---

## Pre-Test Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Verify server starts on port 3000
   - Confirm no build errors in terminal

2. **Clear Browser State**
   - Open browser in incognito/private mode
   - Clear any existing localhost cookies/cache
   - Open Developer Tools (F12) and monitor Console tab

---

## Test Scenarios

### Scenario 1: Authentication Flow

**Objective**: Verify user can sign in and authentication state is properly managed

**Steps**:
1. Navigate to `http://localhost:3000`
2. Observe header shows "Signed out" with "Sign In" button
3. Click "Sign In" button
4. Complete Auth0 login flow (use test credentials)
5. Verify redirect back to application
6. Confirm header shows "Signed in as [Your Name]" with "Sign Out" button

**Expected Results**:
- ✅ Auth0 login page loads correctly
- ✅ Login completes successfully
- ✅ User is redirected back to application
- ✅ Session state persists in header
- ✅ No console errors during auth flow

**Pass/Fail**: [X] PASS [ ] FAIL

---

### Scenario 2: Assignments Page Access

**Objective**: Verify authenticated user can access assignments page

**Steps**:
1. While signed in, navigate to `http://localhost:3000/assignments`
2. Observe page loading sequence
3. Check for any error messages or console errors

**Expected Results**:
- ✅ Page loads without errors
- ✅ Shows "Assignments" heading
- ✅ Shows "View all assignments with Canvas links and status information" description
- ✅ No console errors
- ✅ Loading states display appropriately

**Pass/Fail**: [X] PASS [ ] FAIL

---

### Scenario 3: Assignment Data Display

**Objective**: Verify assignment data loads and displays correctly

**Steps**:
1. On assignments page, observe the data loading process
2. Check if assignments are displayed or if "No assignments found" message appears
3. If assignments are shown, verify:
   - Course names are displayed
   - Assignment titles are clickable links
   - Status badges are shown
   - Due dates are formatted correctly
   - Points are displayed

**Expected Results**:
- ✅ Data loads without errors
- ✅ Either assignments display OR "No assignments found for this student" message
- ✅ Canvas links are properly formatted (if assignments exist)
- ✅ Status badges have appropriate colors
- ✅ No console errors during data loading

**Pass/Fail**: [ ] PASS [X] FAIL

---

### Scenario 4: Canvas Link Functionality

**Objective**: Verify Canvas links work correctly (if assignments exist)

**Steps**:
1. If assignments are displayed, click on an assignment title
2. Verify the link opens in a new tab
3. Check that the URL is properly formatted for Canvas
4. Close the new tab and return to assignments page

**Expected Results**:
- ✅ Links open in new tab (target="_blank")
- ✅ URLs point to correct Canvas instance
- ✅ Links include proper security attributes (rel="noopener noreferrer")
- ✅ No console errors when clicking links

**Pass/Fail**: [ ] PASS [ ] PASS (N/A - No assignments) [ ] FAIL

---

### Scenario 5: Error Handling

**Objective**: Verify error states are handled gracefully

**Steps**:
1. While on assignments page, open Developer Tools
2. Go to Network tab
3. Right-click and select "Block request URL" for `/api/student-data`
4. Refresh the page
5. Observe error handling behavior
6. Remove the network block and refresh again

**Expected Results**:
- ✅ Error state displays user-friendly message
- ✅ Retry button is available (if implemented)
- ✅ No unhandled JavaScript errors
- ✅ Page recovers when network is restored

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### Scenario 6: Session Management

**Objective**: Verify session persistence and logout functionality

**Steps**:
1. While signed in, click "Sign Out" button
2. Verify redirect to logout page
3. Navigate back to `http://localhost:3000`
4. Confirm user is signed out
5. Try to access `/assignments` directly
6. Verify authentication gate works

**Expected Results**:
- ✅ Sign out completes successfully
- ✅ User is properly logged out
- ✅ Direct access to `/assignments` requires re-authentication
- ✅ No console errors during logout

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Performance & Technical Checks

### Console Error Check
- [ ] No JavaScript errors in browser console
- [ ] No network errors (404, 500, etc.)
- [ ] No React warnings or deprecation notices

### Loading Performance
- [ ] Page loads within reasonable time (< 5 seconds)
- [ ] Loading states prevent UI confusion
- [ ] No layout shifts during loading

### Accessibility (Basic)
- [ ] Page is keyboard navigable
- [ ] Focus indicators are visible
- [ ] Alt text present on images (if any)
- [ ] Color contrast is adequate

---

## Test Results Summary

**Overall Status**: [ ] PASS [ ] FAIL

**Scenarios Passed**: ___ / 6

**Critical Issues Found**:
- [ ] None
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________
- [ ] Issue 3: ________________

**Minor Issues Found**:
- [ ] None
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________

**Recommendations**:
- [ ] Ready for Phase 3
- [ ] Address critical issues before proceeding
- [ ] Address minor issues in Phase 3

---

## Notes

**Test Environment Details**:
- Browser: ________________
- OS: ________________
- Screen Resolution: ________________
- Network Speed: ________________

**Additional Observations**:
_________________________________
_________________________________
_________________________________

**Tester Signature**: ________________  
**Date Completed**: ________________
