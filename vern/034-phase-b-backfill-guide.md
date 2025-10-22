# Letter from Vern to Chuckles

**Subject:** Phase B — Backfill with checksums (dry-run first), metrics, and guardrails
**Date:** October 3, 2025

Nice work on Phase A, kid. The facade, flags, and health endpoint give us a safe runway. Let's execute Phase B with zero drama: **dry-run backfill → verify → real backfill**, all observable and revertable.

---

## Objectives (what "done" means)

1. **Dry-run backfill** computes **byte sizes and sha256 checksums** for both stores and **writes nothing**.
2. **Health stays green**; fallback hits trend toward zero after real backfill.
3. **Real backfill** writes Upstash values that hash-match legacy KV.
4. **No code paths change** outside the script and small metrics wiring.
5. Script is **idempotent** and **safe to re-run**.

---

## Keys to migrate (exact names)

We standardize on **`metadata`** (not `metaData`):

* `studentData:v1`
* `metadata:v1`

They'll live at:

* `k('studentData:v1')` → e.g., `cp:dev:studentData:v1`
* `k('metadata:v1')` → e.g., `cp:dev:metadata:v1`

---

## Implementation

### 1) Script: `scripts/backfill-kv-to-upstash.ts`

* Supports **dry-run** (default) and **real** mode (`--write`).
* Prints CSV-like one-line results per key (easy to diff/grep).
* Uses **canonical JSON** hashing (stable stringify) when payloads are JSON; falls back to raw string hash if not.
* Refuses to run if required env vars are missing.

```ts
// scripts/backfill-kv-to-upstash.ts
/* eslint-disable no-console */
import crypto from 'node:crypto';
import process from 'node:process';
import { k } from '@/lib/storage/prefix';
import { kv as upstash } from '@/lib/storage';           // Upstash facade (strings in/out)
import * as legacyKv from '@/lib/storage/kv';            // Vercel KV wrapper (legacy)

type Mode = 'dry' | 'write';
const mode: Mode = process.argv.includes('--write') ? 'write' : 'dry';

const REQUIRED_ENVS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'UPSTASH_NAMESPACE'];
for (const e of REQUIRED_ENVS) {
  if (!process.env[e]) {
    console.error(`ENV ${e} is required`);
    process.exit(1);
  }
}

const KEYS = ['studentData:v1', 'metadata:v1'] as const;

function sha256(buf: Buffer | string) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Try to canonicalize JSON for stable hashing; if parse fails, treat as raw string
function canonicalizeMaybeJSON(s: string | null): { text: string; isJSON: boolean } {
  if (s == null) return { text: '', isJSON: false };
  try {
    const obj = JSON.parse(s);
    const stable = JSON.stringify(obj, Object.keys(obj).sort());
    return { text: stable, isJSON: true };
  } catch {
    return { text: s, isJSON: false };
  }
}

async function run() {
  console.log(`# mode=${mode} namespace=${process.env.UPSTASH_NAMESPACE}`);
  console.log('key,source(store),target(store),sourceSize,sourceHash,targetSize,targetHash,status');

  let failures = 0;

  for (const key of KEYS) {
    const legacyKey = key;                // plain name in Vercel KV
    const upstashKey = k(key);            // namespaced in Upstash

    // 1) Read both
    const [legacyVal, upstashVal] = await Promise.all([
      legacyKv.get<string>(legacyKey),
      upstash.get(upstashKey),
    ]);

    // 2) Hashes
    const legacyCanon = canonicalizeMaybeJSON(legacyVal);
    const upstashCanon = canonicalizeMaybeJSON(upstashVal);

    const row = {
      key,
      srcStore: 'vercelKV',
      tgtStore: 'upstash',
      srcSize: legacyVal ? Buffer.byteLength(legacyVal, 'utf8') : 0,
      srcHash: sha256(legacyCanon.text),
      tgtSize: upstashVal ? Buffer.byteLength(upstashVal, 'utf8') : 0,
      tgtHash: sha256(upstashCanon.text),
    };

    // 3) Decide whether to write
    let status = 'ok';
    const needsWrite = legacyVal != null && legacyCanon.text !== upstashCanon.text;

    if (mode === 'write' && needsWrite) {
      try {
        await upstash.set(upstashKey, legacyVal);
      } catch (e) {
        status = 'write_error';
        failures++;
      }
    } else if (legacyVal == null) {
      status = 'source_null';
    } else if (!needsWrite) {
      status = 'match';
    } else {
      status = 'dry_run_needs_write';
    }

    // 4) If we wrote, recompute target hash
    let tgtSize = row.tgtSize;
    let tgtHash = row.tgtHash;
    if (mode === 'write' && needsWrite && status !== 'write_error') {
      const newVal = await upstash.get(upstashKey);
      const newCanon = canonicalizeMaybeJSON(newVal);
      tgtSize = newVal ? Buffer.byteLength(newVal, 'utf8') : 0;
      tgtHash = sha256(newCanon.text);
      status = (row.srcHash === tgtHash) ? 'wrote_match' : 'wrote_mismatch';
      if (status === 'wrote_mismatch') failures++;
    }

    console.log([
      key, row.srcStore, row.tgtStore, row.srcSize, row.srcHash, tgtSize, tgtHash, status,
    ].join(','));
  }

  if (mode === 'write' && failures > 0) {
    console.error(`# FAILURES=${failures}`);
    process.exit(2);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Notes**

* Uses your existing **Upstash facade** (`@/lib/storage`) so we don't bypass Phase A logic.
* Reads legacy via your **Vercel KV wrapper**; no extra clients.
* **Canonical JSON hashing** lets us ignore harmless key order differences.

---

### 2) NPM scripts

```json
// package.json
{
  "scripts": {
    "migrate:dry": "tsx scripts/backfill-kv-to-upstash.ts",
    "migrate:write": "tsx scripts/backfill-kv-to-upstash.ts --write"
  }
}
```

---

### 3) Runbook

1. **Dry-run (required)**

   ```bash
   MIGRATION_DRY_RUN=1 USE_KV_FALLBACK=1 DUAL_WRITE=1 \
   UPSTASH_NAMESPACE=cp:dev \
   npm run migrate:dry | tee migration_dry.csv
   ```

   * Expect `status=match` or `dry_run_needs_write`.
   * If you see `source_null`, confirm we truly have no legacy data for that key.

2. **Sanity check**

   * Spot-check hashes for both keys.
   * Hit the app once, then GET `/api/_health/storage`; verify:

     * `namespace` correct
     * `upstashPingMs` sane
     * flags reflect reality
     * keysPresent booleans are true (if you expose them)

3. **Real backfill**

   ```bash
   USE_KV_FALLBACK=1 DUAL_WRITE=1 \
   UPSTASH_NAMESPACE=cp:dev \
   npm run migrate:write | tee migration_write.csv
   ```

   * Expect `wrote_match` or `match`.
   * **No `wrote_mismatch`**. If you see it, stop and ping me—don't proceed.

4. **Observe**

   * Keep `USE_KV_FALLBACK=1` for the day.
   * Watch `kv_fallback_hits_total`. After users exercise the app, this should trend to **0**.
   * If it doesn't, there's a read path we missed—grep and fix.

---

## Acceptance criteria for Phase B

* `migration_dry.csv` shows either `match` or `dry_run_needs_write` for both keys; no failures.
* `migration_write.csv` shows `wrote_match` or `match`; **no** `wrote_mismatch` or `write_error`.
* Health endpoint p50 `upstashPingMs` ≤ 150ms.
* `kv_fallback_hits_total == 0` for at least **6 consecutive hours** after real backfill (business hours traffic).
* No API error-rate or latency regressions.

---

## Common footguns (don't)

* **Renaming keys mid-flight.** We are not changing `:v1` suffixes.
* **Double-stringify.** Keep JSON boundaries at API edges; the script writes **raw legacy value**.
* **Turning off Vercel KV envs now.** Not until Phase E.
* **Skipping dry-run.** It catches 90% of surprises.

---

## What comes after a clean Phase B

* Proceed to **Phase C**: keep `USE_KV_FALLBACK=1`, enable `DUAL_WRITE=1` for 24h.
* Confirm dual-write error metric stays quiet.
* Then Phase D: disable fallback, leave dual-write one more day, then disable dual-write.
* Finally Phase E: delete `@vercel/kv` and its envs, remove the fallback code paths.

Ping me with the two CSVs when you're done with dry-run and write. If hashes match, you've earned your sandwich.

—Vern

