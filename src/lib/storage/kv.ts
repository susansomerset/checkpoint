import { StudentData } from '@/lib/student/schema';

const KEY = 'studentData:v1';

// Mock implementation for testing - replace with real Vercel KV later
const mockStorage: Record<string, string> = {};

export async function loadStudentData(): Promise<StudentData | null> {
  const raw = mockStorage[KEY];
  return raw ? JSON.parse(raw) as StudentData : null;
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  mockStorage[KEY] = JSON.stringify(doc);
}
