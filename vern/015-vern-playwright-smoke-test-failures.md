# Letter to Vern: Playwright Smoke Test Failures and Proposed Solutions

**Date:** September 28, 2025  
**From:** Chuckles Somerset  
**Subject:** Playwright Smoke Test Failures - Console Errors and Authentication Flow Issues

---

## Current Situation

We've implemented a hybrid real data cache system for Playwright tests (Option 3 from your previous guidance) and created a minimal smoke test suite to validate core functionality before running the full test suite. However, the smoke tests are failing, and I'd like your insights on the best approach to fix them.

## Smoke Test Results

**Status:** 1/3 tests passing (33% success rate)

### ✅ **Passing Test**
- **Auth endpoint test**: `/api/auth/me` returns correct 204/200 responses

### ❌ **Failing Tests**

#### **Test 1: Homepage Console Errors**
```
Error: expect(errors).toHaveLength(0)
Expected length: 0
Received length: 1
Received array: ["Failed to fetch student data: Error"]
```

**Root Cause Analysis:**
- The homepage loads successfully, but our `StudentContext` is fetching student data on every page load
- When not authenticated, the API returns 401, which gets logged as a console error
- The `StudentContext` is currently fetching data on mount regardless of authentication state

#### **Test 2: Authentication Flow - Multiple Sign In Links**
```
Error: strict mode violation: locator('a[href="/api/auth/login"]') resolved to 2 elements
```

**Root Cause Analysis:**
- There are two "Sign In" links on the page:
  1. One in the header (`SessionChip` component)
  2. One in the main content area (`AssignmentList` component)
- Playwright's strict mode requires unique selectors

## Proposed Solutions

### **Solution 1: Conditional Data Fetching Based on Authentication State**

Instead of hardcoding paths (which you correctly advised against), I propose making the `StudentContext` conditional on authentication state:

```typescript
// Add authentication state to context
interface StudentContextType {
  // ... existing properties
  isAuthenticated: boolean
  setAuthenticated: (auth: boolean) => void
}

// Only fetch when authenticated
useEffect(() => {
  if (isAuthenticated) {
    fetchData()
  }
}, [isAuthenticated])

// Components set auth state
const { user, isLoading: authLoading } = useUser()
const { setAuthenticated } = useStudent()

useEffect(() => {
  setAuthenticated(!!user && !authLoading)
}, [user, authLoading, setAuthenticated])
```

### **Solution 2: Improve Error Handling**

```typescript
// Don't log expected 401s as console errors
catch (err: any) {
  if (err.message.includes('401') || err.message.includes('AUTH_REQUIRED')) {
    setError(null) // Clear error for expected auth failures
  } else {
    console.error('Failed to fetch student data:', err)
    setError(err.message || 'Failed to load student data')
  }
}
```

### **Solution 3: Fix Playwright Selector Specificity**

```typescript
// Use more specific selectors
const signInButton = page.locator('a[href="/api/auth/login"]').first()
// OR
const signInButton = page.getByRole('link', { name: 'Sign In' }).first()
```

## Questions for Your Guidance

1. **Authentication State Management**: Is the approach of having `StudentContext` track authentication state the right pattern, or should this be handled differently?

2. **Error Handling Philosophy**: Should we completely suppress 401 errors from console logging, or is there a better way to distinguish between "expected" and "unexpected" authentication failures?

3. **Playwright Test Strategy**: Given that we're using real data caching, should the smoke tests be more lenient about console errors, or should we ensure the application is completely error-free even when not authenticated?

4. **Context Architecture**: Is there a cleaner way to structure the context so that data fetching is naturally conditional on authentication without adding complexity?

## Current Test Infrastructure

- **Real Data Cache**: Working (fetches real data from API, caches for 5 minutes)
- **Auth Mocks**: Working (mocks `/api/auth/me` for tests)
- **Student Selection**: Working (instant switching, no API calls)
- **Smoke Tests**: Failing due to console errors and selector issues

## Next Steps

Once we resolve the smoke test issues, the plan is:
1. Run smoke tests (should pass 100%)
2. If smoke tests pass, run full test suite
3. If full suite passes, we'll have achieved Phase 2 completion

I believe the core issue is that our `StudentContext` is too aggressive about fetching data, causing console errors on pages that don't need student data. Your insights on the best architectural approach would be greatly appreciated.

Thank you for your continued guidance!

Best regards,  
Chuckles Somerset
