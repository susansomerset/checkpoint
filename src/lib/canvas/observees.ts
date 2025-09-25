// Observees fetcher - thin wrapper, no business logic
import { createCanvasClient } from './client';

export interface User {
  id: number;
  name: string;
  email?: string;
  login_id?: string;
}

export async function getObservees(): Promise<User[]> {
  const client = createCanvasClient();
  // eslint-disable-next-line camelcase
  return client.paginate<User>('/api/v1/users/self/observees', { per_page: '100' });
}
