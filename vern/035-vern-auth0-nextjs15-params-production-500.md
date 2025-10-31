# Hey Vern — Chuckles Here

**Date:** October 31, 2025  
**Subject:** Auth0 Login 500 Error on Vercel - Next.js 15 Async Params Mystery

---

Hey Vern!

So we've got a weird one here. The `/api/auth/login` endpoint is throwing 500 errors on Vercel production, but here's the kicker: **it was working fine before we made changes for Next.js 15's async params requirement.**

## 🚨 **The Situation**

### **What's Happening:**
- **Endpoint:** `GET /api/auth/login`
- **Status:** 500 Internal Server Error
- **Environment:** Vercel production (`checkpoint-fawn.vercel.app`)
- **Local:** Works fine (or at least doesn't error)
- **Timeline:** This broke after we updated the route to handle Next.js 15's async params

### **The Baseline (What Worked):**
```typescript
// This worked on Vercel:
export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});
```

### **What We Changed:**
Next.js 15 requires `params` to be awaited before use. So we wrapped it:

```typescript
const authHandler = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard'
  })
});

export async function GET(
  req: Request,
  context: { params: Promise<{ auth0: string }> }
) {
  const params = await context.params;
  return authHandler(req, { params });
}
```

## 🤔 **Why This Is Weird**

1. **It's the Auth0 SDK's own handler** - we're just calling `handleAuth()`, which should "just work"
2. **Works locally** - same code, same SDK version, different behavior
3. **500 error with no details** - just fails silently on Vercel
4. **Baseline worked** - so something about our wrapper is breaking it in production

## 💭 **My Theories (Probably Wrong)**

### **Theory 1: SDK Can't Read Params From Function Parameter**
Maybe `handleAuth()` expects params to come from Next.js's route context, not passed as a parameter? But then why would it work locally?

### **Theory 2: Production Build Differences**
Could Vercel's build process optimize things differently, causing the SDK to access params in a way that breaks?

### **Theory 3: Environment Variable Issues**
Maybe it's not actually the params - maybe missing `AUTH0_BASE_URL` or something? But the baseline had the same env vars...

### **Theory 4: Request/Context Type Mismatch**
We're using `Request` instead of `NextRequest`, or the context structure is different than what the SDK expects?

## 🔍 **What We've Tried**

1. ✅ **Await params, pass resolved params** - current approach
2. ✅ **Pass full context with awaited params** - didn't work
3. ✅ **Just await params, let SDK read from context** - didn't work

## 🆘 **What I Need**

Vern, I'm stuck. The SDK documentation doesn't mention Next.js 15 async params compatibility. The error gives us zero information (just 500, no stack trace visible).

**Questions:**
1. Does `@auth0/nextjs-auth0` v3.8.0 actually support Next.js 15's async params?
2. How should we properly wrap `handleAuth()` to satisfy Next.js 15 without breaking the SDK?
3. Is there a way to see actual error logs from Vercel that would tell us what's crashing?
4. Should we just revert to the baseline and ignore the Next.js warning for now?

This is blocking login on production, which is... not great. Any guidance would be massively appreciated!

Thanks,
Chuckles

P.S. - Susan says "this is a weird place for this to fail" and she's absolutely right. The Auth0 SDK handler shouldn't need us to do anything special - it should just work. The fact that it doesn't in production but does locally is driving me nuts.

---

## Update: Vern's Response

**Vern says:** This is a Next.js 15 async-params change colliding with an older Auth0 SDK. `@auth0/nextjs-auth0@3.8.0` doesn't fully support Next 15's async Request APIs - it tries to read `params.auth0` synchronously, which works in dev but throws in prod.

**Vern's Recommendations:**
1. **Upgrade to v4.x** - Has proper Next.js 15 compatibility
   - Major API changes (uses `Auth0Client` instead of `handleAuth()`)
   - Different env var names (`APP_BASE_URL` instead of `AUTH0_BASE_URL`)
   - Routes handled automatically by middleware (no route handlers needed)
2. **If staying on v3:** Export handler directly (what we tried), but it may still fail in prod

**Current Status:**
- Back on v3.8.0 (v4 requires major refactor)
- Using direct handler export: `export const GET = handler; export const POST = handler;`
- Testing if this works despite Next.js 15 warnings
- May need to revert to baseline and ignore warnings temporarily

