import * as kv from './kv';
import { StudentData } from '@/lib/student/schema';

export async function loadStudentData(): Promise<StudentData | null> {
  switch (process.env.STORAGE_BACKEND || 'kv') {
    case 'kv':
    default:
      return kv.loadStudentData();
  }
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  switch (process.env.STORAGE_BACKEND || 'kv') {
    case 'kv':
    default:
      return kv.saveStudentData(doc);
  }
}
