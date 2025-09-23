export function keyPrefix() {
  const env = process.env.APP_ENV || 'dev';
  return process.env.KEY_PREFIX || `cp:${env}:`;
}
export const k = (name: string) => `${keyPrefix()}${name}`;

