# Parking Lot — Chuckles cleanup & regression toggles

## Smoke Routes & Test Harness
- [ ] Replace `/api/kv-smoke` with a CLI smoke script (`npm run smoke:persist`) once Canvas loaders are stable.
- [ ] Ensure `/api/kv-smoke` is 404 in prod unless `SMOKE_ROUTES=1` AND a valid `SMOKE_TOKEN` is provided.
- [ ] Remove `SMOKE_ROUTES` and `SMOKE_TOKEN` from prod after any temporary use.

## Storage / Persistence
- [ ] Add a tiny `/api/kv-wipe` gated route for dev-only to clear `cp:dev:` keys (never enabled in prod).
- [ ] Document key naming & prefixes (`cp:<env>:`) in README.

## Step 3+ Artifacts
- [ ] Canvas client call budget counter/log (dev-only).
- [ ] Bookmarks viewer route (dev-only) for quick delta cursors.

## Dev Experience
- [ ] Add `npm run dev:check-port` preflight (refuse to start if 3000 is busy).
- [ ] Pre-commit: `typecheck`, `lint`, and forbid "smoke routes" on `main` via a simple check.

