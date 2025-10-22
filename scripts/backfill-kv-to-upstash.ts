/* eslint-disable no-console */
import crypto from 'node:crypto';
import process from 'node:process';
import { k } from '@/lib/storage/prefix';
import { kv as upstash } from '@/lib/storage';           // Upstash facade (strings in/out)
import * as legacyKv from '@/lib/storage/kv-legacy';     // Vercel KV wrapper (legacy)

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

