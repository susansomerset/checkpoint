export async function canvasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.CANVAS_BASE_URL;
  const token = process.env.CANVAS_TOKEN;
  if (!base || !token) throw new Error('Canvas env not configured');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Canvas ${res.status}`);
  return res.json();
}

