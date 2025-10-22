/**
 * Startup validation for storage configuration
 * Ensures UPSTASH_NAMESPACE is set in production
 */

export function validateStorageConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const namespace = process.env.UPSTASH_NAMESPACE;

  if (nodeEnv === 'production') {
    if (!namespace || namespace.trim().length === 0) {
      throw new Error('UPSTASH_NAMESPACE is required in production');
    }
    console.info(`[storage] Production mode: using namespace "${namespace}"`);
  } else {
    if (namespace) {
      console.info(`[storage] Development mode: using namespace "${namespace}"`);
    } else {
      console.warn('[storage] Development mode: no UPSTASH_NAMESPACE, will use fallback');
    }
  }

  // Namespace echo for audit trail
  if (namespace) {
    console.info(`[storage] UPSTASH_NAMESPACE="${namespace}"`);
  }

  // Validate other required env vars
  const requiredVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`[storage] Missing Redis env vars: ${missing.join(', ')}`);
  }
}

// Only run validation during runtime (not build time)
// Check for NEXT_PHASE to detect build vs runtime
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';
if (!isBuilding) {
  validateStorageConfig();
}
