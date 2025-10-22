export function keyPrefix() {
  const env = process.env.APP_ENV || 'dev';
  return process.env.KEY_PREFIX || `cp:${env}:`;
}

export const k = (name: string) => {
  const ns = process.env.UPSTASH_NAMESPACE;

  if (ns && ns.trim().length > 0) {
    return `${ns}:${name}`;
  }

  // Allow a DEV fallback for local workflows, but never in prod
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    if (process.env.LOG_NS_WARN !== '0') {
      console.warn(`[storage] UPSTASH_NAMESPACE missing; using fallback "dev:${name}"`);
    }
    return `dev:${name}`;
  }

  // Prod: fail fast—don't write to un-namespaced keys
  throw new Error('UPSTASH_NAMESPACE is required in production');
};

