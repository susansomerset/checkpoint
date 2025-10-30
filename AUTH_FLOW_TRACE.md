# Authentication Flow Trace

## Complete Request Flow

### 1. **Initial Request: User visits `/dashboard`**

```
User Browser
    ↓ GET /dashboard
Next.js Middleware (src/middleware.ts)
    ↓ Matches '/dashboard/:path*' pattern
withMiddlewareAuthRequired() (from @auth0/nextjs-auth0/edge)
    ↓ Checks for session cookie
```

**Middleware Logic:**
- Runs in **Edge Runtime** (Vercel Edge Function)
- Matches routes: `/dashboard/:path*`, `/settings/:path*`
- Does NOT match: `/api/auth/*` (intentionally excluded)
- `withMiddlewareAuthRequired()` checks for Auth0 session cookie

### 2. **No Session Cookie Found → Redirect to Login**

```
Middleware detects no session
    ↓
Redirects to /api/auth/login
    ↓
GET /api/auth/login
    ↓
src/app/api/auth/[auth0]/route.ts
    ↓
handleAuth() from @auth0/nextjs-auth0 (Node runtime)
```

**Auth Handler (`src/app/api/auth/[auth0]/route.ts`):**
- Runs in **Node.js runtime** (required by Auth0 SDK)
- `handleAuth()` handles multiple routes:
  - `/api/auth/login` → redirects to Auth0
  - `/api/auth/logout` → clears session
  - `/api/auth/callback` → processes Auth0 callback
  - `/api/auth/me` → returns user info

### 3. **Auth0 Login Flow**

```
handleAuth() receives /api/auth/login
    ↓
Constructs Auth0 login URL with:
  - AUTH0_DOMAIN (from env)
  - AUTH0_CLIENT_ID (from env)  
  - AUTH0_BASE_URL (from env) as returnTo
    ↓
Redirects browser to: https://dev-lawlsypxo8s3bt4y.us.auth0.com/authorize?...&returnTo=https://checkpoint-fawn.vercel.app/api/auth/callback
    ↓
User authenticates with Auth0
    ↓
Auth0 redirects back to: /api/auth/callback?code=...&state=...
```

**Critical Environment Variables Required:**
- `AUTH0_SECRET` - Used to encrypt session cookies
- `AUTH0_DOMAIN` - Your Auth0 tenant domain
- `AUTH0_CLIENT_ID` - Your Auth0 app client ID
- `AUTH0_CLIENT_SECRET` - Your Auth0 app client secret
- `AUTH0_BASE_URL` - Must be exact deployment URL (e.g., `https://checkpoint-fawn.vercel.app`)

### 4. **Callback Processing & Cookie Setting**

```
GET /api/auth/callback?code=...&state=...
    ↓
handleAuth() processes callback
    ↓
Exchanges code for tokens with Auth0
    ↓
Creates session object with user info
    ↓
Sets encrypted session cookies:
  - appSession.0
  - appSession.1
  - etc.
    ↓
Cookie attributes (from env vars if set):
  - SameSite=Lax (from AUTH0_COOKIE_SAME_SITE)
  - Secure=true (from AUTH0_SECURE_COOKIE)
  - HttpOnly=true (always)
  - Domain=checkpoint-fawn.vercel.app (or auto-detected)
    ↓
Redirects user to /dashboard
```

**Cookie Configuration:**
- Cookies are encrypted using `AUTH0_SECRET`
- Split into multiple cookies if payload is large
- Must be readable by both middleware (Edge) and API routes (Node)

### 5. **Authenticated Request to Dashboard**

```
GET /dashboard (with session cookies)
    ↓
Middleware (Edge Runtime)
    ↓
withMiddlewareAuthRequired() reads cookies:
  - Decrypts using AUTH0_SECRET
  - Validates session
    ↓
If valid: calls our middleware handler → NextResponse.next()
    ↓
Request continues to /dashboard page
```

### 6. **Client-Side: UserProvider Initializes**

```
Dashboard page loads (src/app/dashboard/page.tsx)
    ↓
RootLayout wraps with ClientAuthProvider
    ↓
ClientAuthProvider wraps with UserProvider (from @auth0/nextjs-auth0/client)
    ↓
UserProvider fetches /api/auth/me
    ↓
/api/auth/me handled by handleAuth() automatically
    ↓
Returns user object if authenticated, 204 if not
    ↓
Dashboard page: useUser() hook gets user data
    ↓
Page displays "Hello, {user.name}!"
```

**Client-Side Auth:**
- `UserProvider` automatically calls `/api/auth/me` on mount
- `useUser()` hook provides: `{ user, error, isLoading }`
- No manual cookie handling needed - SDK does it

### 7. **API Route: Protected Endpoint**

```
POST /api/student-data/reset
    ↓
Browser sends request with cookies in headers:
  Cookie: appSession.0=...; appSession.1=...
    ↓
src/app/api/student-data/reset/route.ts
    ↓
Creates NextResponse object
    ↓
getSession(req, res) from @auth0/nextjs-auth0:
  - Reads cookies from request
  - Decrypts using AUTH0_SECRET
  - Validates session
    ↓
If session valid:
  - Returns session object
  - Route continues with session.user, session.accessToken, etc.
    ↓
If no session:
  - getSession() returns null
  - Route returns 401 Unauthorized
```

**Server-Side Session Check:**
```typescript
const res = new NextResponse();
const session = await getSession(req, res);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Critical Points & Potential Issues

### 1. **Cookie Not Being Sent**
**Symptom:** API routes return 401 even though user appears logged in

**Causes:**
- Cookie domain mismatch
- SameSite attribute blocking cookies
- Secure cookie not set (but site is HTTPS)
- Cookie path incorrect

**Debug:**
- Check browser DevTools → Application → Cookies
- Verify cookies exist for `checkpoint-fawn.vercel.app`
- Check cookie attributes (SameSite, Secure, HttpOnly)

### 2. **Middleware Failure**
**Symptom:** `MIDDLEWARE_INVOCATION_FAILED` error

**Causes:**
- Middleware handler doesn't return response
- Edge runtime can't access Auth0 SDK properly
- Missing environment variables in Edge context

**Current Fix:**
- Middleware explicitly returns `NextResponse.next()`

### 3. **Environment Variable Issues**
**Symptom:** 500 errors on `/api/auth/login`

**Required Variables:**
- All Auth0 vars must be set in Vercel
- `AUTH0_BASE_URL` must match exact deployment URL
- Cookie vars (`AUTH0_COOKIE_SAME_SITE`, `AUTH0_SECURE_COOKIE`) recommended

**Check:**
- Visit `/api/auth/health` to see which vars are missing

### 4. **Runtime Mismatch**
**Important:**
- Middleware = **Edge Runtime** (fast, limited APIs)
- Auth handler = **Node Runtime** (full Node.js APIs)
- API routes = **Node Runtime** (for getSession)

**Why:**
- Auth0 SDK requires Node runtime for cookie encryption/decryption
- Middleware uses Edge runtime for performance

## Current Status Check

To verify everything works:

1. **Check Environment Variables:**
   ```bash
   curl https://checkpoint-fawn.vercel.app/api/auth/health
   ```

2. **Check Login Flow:**
   ```bash
   curl -I https://checkpoint-fawn.vercel.app/api/auth/login
   # Should redirect to Auth0
   ```

3. **Check Session (after login):**
   ```bash
   curl -I https://checkpoint-fawn.vercel.app/api/auth/me
   # Should return 200 with user data, or 204 if not logged in
   ```

4. **Check Protected API:**
   ```bash
   curl -X POST https://checkpoint-fawn.vercel.app/api/student-data/reset \
     -H "Cookie: appSession.0=..." \
     # Should return 200 with data, or 401 if no valid session
   ```

## Known Issues & Fixes

### Issue: Cookies Not Sent
**Fix:** Set in Vercel:
- `AUTH0_COOKIE_SAME_SITE=Lax`
- `AUTH0_SECURE_COOKIE=true`
- `AUTH0_BASE_URL=https://checkpoint-fawn.vercel.app`

### Issue: Middleware Failing
**Fix:** Added explicit handler that returns `NextResponse.next()`

### Issue: 500 on Login
**Fix:** Reverted to simple `handleAuth()` - no extra config needed

