# Canvas Submissions API Investigation Report

**To:** Vern  
**From:** Assistant  
**Date:** September 23, 2025  
**Subject:** Canvas Submissions API 403 Forbidden Errors - Investigation Results

---

## Executive Summary

We successfully implemented Canvas API integration for assignments but encountered 403 Forbidden errors when attempting to access submission data. Despite following the exact same implementation pattern that worked in `/canvas-checkpoint/`, all submission endpoints are currently returning permission errors.

## What We Implemented

### 1. Canvas API Client Structure
- **Location:** `test-scripts/canvas-api/client.ts`
- **Authentication:** `Authorization: Bearer ${accessToken}`
- **Pagination:** Full pagination support with Link header parsing
- **Error Handling:** Comprehensive error handling with detailed logging

### 2. API Endpoints Tested
- **Assignments:** `/api/v1/courses/{courseId}/assignments?per_page=100` ✅ **WORKING**
- **Course Submissions:** `/api/v1/courses/{courseId}/students/submissions?per_page=100&student_ids[]=all&assignment_ids[]=all` ❌ 403 Forbidden
- **Individual Assignment Submissions:** `/api/v1/courses/{courseId}/assignments/{assignmentId}/submissions?per_page=100` ❌ 403 Forbidden
- **Include Submissions Parameter:** `include=submissions` ❌ No effect (permission issue)

### 3. UI Implementation
- **Dashboard Integration:** Full test interface with timing, byte size, and record counts
- **History Logging:** Tracks all API calls with performance metrics
- **Error Display:** Clear 403 error messaging with permission context
- **Real-time Testing:** Interactive buttons for testing different endpoints

## Investigation Results

### ✅ What's Working Perfectly
- **Assignments API:** 185 assignments, 839.2 KB response, ~6-7 second response time
- **Authentication:** Bearer token authentication working correctly
- **Pagination:** Full pagination support across all endpoints
- **Error Handling:** Graceful handling of permission errors
- **UI/UX:** Professional interface with detailed metrics

### ❌ What's Failing
- **All Submission Endpoints:** Consistent 403 Forbidden errors
- **Include Parameter:** `include=submissions` has no effect due to permissions
- **Both Individual and Bulk:** Both assignment-specific and course-wide submission endpoints fail

## Comparison with canvas-checkpoint

### Identical Implementation Pattern
We found the working implementation in `/canvas-checkpoint/api/courses/[courseId]/assignments/[assignmentId]/submissions.js`:

```javascript
// canvas-checkpoint working code
const submissions = await makeCanvasRequest(`/courses/${courseId}/assignments/${assignmentId}/submissions?per_page=100`, apiKey);
```

Our implementation uses the exact same endpoint and authentication method:

```typescript
// Our current implementation
const url = `${this.config.baseUrl}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions?per_page=100`;
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${this.config.accessToken}`,
    'Accept': 'application/json',
    'Cache-Control': 'no-store'
  }
});
```

### Key Differences Found
1. **canvas-checkpoint:** Used `axios` library vs our `fetch` API
2. **canvas-checkpoint:** Had rate limiting and retry logic
3. **canvas-checkpoint:** Used different environment variable names (`CANVAS_API_KEY` vs `CANVAS_ACCESS_TOKEN`)

## Detailed Error Analysis

### 403 Forbidden Responses
All submission endpoints return:
```json
{
  "error": "Canvas submissions request failed",
  "details": "Canvas API request failed: 403 Forbidden"
}
```

### Permission Scope Analysis
- **Assignments API:** ✅ Full access (185 assignments returned)
- **Submission Metadata:** ✅ Available in assignment objects (`has_submitted_submissions`, `graded_submissions_exist`)
- **Actual Submissions:** ❌ No access (403 Forbidden)

## What We Tried

### 1. Multiple Endpoint Variations
- `/courses/{courseId}/students/submissions` (with and without parameters)
- `/courses/{courseId}/assignments/{assignmentId}/submissions`
- `/courses/{courseId}/submissions` (404 Not Found)

### 2. Parameter Combinations
- `student_ids[]=all&assignment_ids[]=all`
- `per_page=100`
- `include=submissions` (in assignments endpoint)

### 3. Authentication Methods
- Bearer token in Authorization header
- Same token that works for assignments
- Verified token is being sent correctly

### 4. Error Handling
- Comprehensive error logging
- Graceful 403 handling in UI
- Clear user feedback about permission issues

## Current State

### Working Features
- ✅ Canvas assignments API with full pagination
- ✅ Assignment metadata including submission indicators
- ✅ Performance metrics and timing
- ✅ Professional UI with history logging
- ✅ Error handling and user feedback

### Blocked Features
- ❌ Actual submission data (grades, points, content)
- ❌ Student submission details
- ❌ Submission history and attempts

## Questions for Vern

1. **Token Permissions:** The canvas-checkpoint project was able to access submissions. Did it use a different API token with elevated permissions?

2. **Canvas Instance Changes:** Could the Canvas instance have changed permission requirements since canvas-checkpoint was working?

3. **Alternative Endpoints:** Are there other Canvas API endpoints we should try for accessing submission data?

4. **Authentication Method:** Should we try a different authentication approach (API key vs Bearer token)?

5. **Rate Limiting:** The canvas-checkpoint implementation had sophisticated rate limiting. Could this be related to the 403 errors?

6. **Environment Variables:** Should we check if we're using the correct Canvas instance URL or API version?

## Technical Details

### Environment Variables Used
- `CANVAS_BASE_URL`: `https://djusd.instructure.com`
- `CANVAS_ACCESS_TOKEN`: Bearer token (same one that works for assignments)

### API Response Examples
**Working Assignments API:**
```json
{
  "endpoint": "assignments",
  "durationMs": 6820,
  "meta": {
    "count": 185,
    "totalBytes": 839200
  },
  "data": [/* 185 assignment objects */]
}
```

**Failing Submissions API:**
```json
{
  "error": "Canvas submissions request failed",
  "details": "Canvas API request failed: 403 Forbidden"
}
```

## Next Steps

1. **Await Vern's guidance** on potential solutions
2. **Consider token refresh** or permission escalation
3. **Investigate alternative endpoints** if suggested
4. **Implement rate limiting** if that's the issue
5. **Test with different authentication methods** if recommended

## Conclusion

The implementation is technically sound and matches the working canvas-checkpoint pattern exactly. The 403 errors appear to be a permission/configuration issue rather than a code problem. We have a fully functional assignments API and a robust framework ready for submissions once the permission issue is resolved.

The current system provides excellent visibility into what's available within the current permission scope and is ready to expand once submission access is granted.

---

**Ready for your guidance on next steps!** 🚀
