# Cookie Fix for Vercel Deployment

## The Problem
Cookies aren't being sent with API requests, causing 401 errors. This is a cookie configuration issue.

## Required Environment Variables in Vercel

Add these to your Vercel project settings (Environment Variables):

1. **AUTH0_COOKIE_SAME_SITE** = `Lax`
   - For same-site requests (your app and API are on same domain)
   - Use `None` only if you need cross-site cookies (requires Secure=true)

2. **AUTH0_SECURE_COOKIE** = `true`
   - Required for HTTPS (which Vercel uses)

3. **AUTH0_COOKIE_DOMAIN** = (leave empty or unset)
   - Don't set this - let browser handle domain matching
   - Setting it can break cookie sending

4. **AUTH0_BASE_URL** = `https://checkpoint-fawn.vercel.app`
   - Must match your exact deployment URL
   - This is critical for cookie domain matching

## How to Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable above
3. Set for "Production" environment
4. Redeploy after adding

## Why This Happens

- Auth0 SDK sets cookies based on environment variables
- Default cookie settings might not work with Vercel's deployment setup
- Cookies need `SameSite=Lax` and `Secure=true` for HTTPS same-site requests
- The domain must match exactly between where cookie is set and where it's read

## Testing

After setting these variables and redeploying:
1. Log in on your Vercel deployment
2. Check browser DevTools → Application → Cookies
3. You should see cookies like `appSession.0`, `appSession.1` with domain `checkpoint-fawn.vercel.app`
4. Make a request to `/api/student-data/reset`
5. Check Network tab → Request Headers → should see `Cookie:` header

