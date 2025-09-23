import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Missing Redis env (UPSTASH_REDIS_REST_URL/_TOKEN)');
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function getRaw(key: string) {
  const result = await getRedis().get(key);
  return result ? JSON.stringify(result) : null;
}
export async function setRaw(key: string, val: string) {
  await getRedis().set(key, val);
}
export async function delRaw(key: string) {
  await getRedis().del(key);
}
