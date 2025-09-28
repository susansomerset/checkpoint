# Letter to Vern: Playwright E2E Testing Challenges

**Date**: September 27, 2025  
**From**: Chuckles  
**Subject**: Playwright E2E Testing - Authentication Flow Blocking Tests

---

## Current Situation

We've successfully resolved the Node.js environment issues (Node 20.19.5, zero EBADENGINE warnings, Playwright browsers installed), but our E2E tests are failing due to authentication flow complexity.

## Test Results Analysis

### ✅ **What's Working**
- **Unit tests**: 48/48 passing
- **Dev server**: Running cleanly on localhost:3000
- **Auth endpoint**: `/api/auth/me` correctly returns 204 when logged out
- **Basic auth tests**: 3/3 auth-related E2E tests passing

### ❌ **What's Failing**
- **Integration tests**: 12/15 failing due to authentication flow
- **Root cause**: Tests can't complete Auth0 login flow within 30-second timeout
- **Specific issue**: `await page.waitForURL('http://localhost:3000/dashboard')` times out after `/api/auth/login`

## Detailed Test Failure Pattern

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
waiting for navigation to "http://localhost:3000/dashboard" until "load"

Call log:
  - navigating to "/api/auth/login", waiting until "load"
  - waiting for navigation to "http://localhost:3000/dashboard"
```

**The Problem**: Tests expect this flow:
1. `GET /api/auth/login` → redirects to Auth0
2. Auth0 authentication → redirects back to `/dashboard`
3. Navigate to `/assignments`

**Reality**: Step 2 never completes in test environment.

## Why This Is Happening

1. **Auth0 External Dependency**: Tests depend on external Auth0 service
2. **Interactive Authentication**: Auth0 requires user interaction (email/password)
3. **Test Environment Isolation**: Playwright can't handle OAuth redirect flows easily
4. **Timeout Issues**: 30-second timeout insufficient for full OAuth flow

## Recommended Resolution

### **Option A: Mock Authentication (Recommended)**
```typescript
// Mock /api/auth/me to return authenticated user
await page.route('**/api/auth/me', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      sub: 'test-user-123',
      email: 'test@example.com', 
      name: 'Test User'
    })
  });
});
```

**Benefits**:
- ✅ Fast, reliable tests
- ✅ No external dependencies
- ✅ Tests focus on UI logic, not auth flow
- ✅ Consistent test environment

### **Option B: Skip E2E Authentication Tests**
- Keep unit tests for auth logic
- Focus E2E tests on UI components only
- Manual testing for auth flows

### **Option C: Use Playwright Auth Storage**
- Record one successful login session
- Reuse session state across tests
- More complex but closer to real user flow

## Justification for Option A

**Why Mocking is the Right Choice**:

1. **Separation of Concerns**: E2E tests should verify UI behavior, not authentication infrastructure
2. **Reliability**: External services (Auth0) can be flaky in CI/CD
3. **Speed**: Mocked tests run 10x faster
4. **Maintenance**: No need to maintain test credentials or handle auth service changes
5. **Focus**: Tests can focus on the actual feature (student selector, assignment display)

**Industry Best Practice**: Most teams mock authentication in E2E tests and test auth flows separately with integration tests or manual testing.

## Alternative: Simplified Test Strategy

If you prefer to avoid mocking entirely, I recommend:

1. **Keep current auth tests** (3/3 passing) for basic auth endpoint testing
2. **Remove authentication from integration tests** - test UI components in isolation
3. **Add component-level tests** using React Testing Library
4. **Manual testing** for full user flows

## Questions for You

1. **Do you prefer mocking authentication** for faster, more reliable tests?
2. **Should we focus on component testing** instead of full E2E flows?
3. **Are there specific user flows** you want to ensure are tested end-to-end?
4. **How important is testing the full Auth0 integration** vs. testing our UI components?

## Current Status

- ✅ Node 20 environment stable
- ✅ Playwright browsers working
- ✅ Unit tests passing
- ✅ Manual browser testing successful
- ❌ E2E tests blocked by auth complexity

**Ready to proceed** once we align on testing strategy.

---

**Recommendation**: Go with Option A (mock authentication) to unblock E2E testing and focus on what matters - ensuring our UI components work correctly.

What are your thoughts?
