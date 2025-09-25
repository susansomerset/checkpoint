import { StudentData } from '@/lib/student/schema';
import { kv } from '@vercel/kv';

const KEY = 'studentData:v1';

export async function loadStudentData(): Promise<StudentData | null> {
  try {
    const raw = await kv.get(KEY);
    console.info(`ZXQ kv.loadStudentData: ${raw ? 'FOUND' : 'NOT_FOUND'} - ${raw ? String(raw).length : 0} bytes`);
    return raw ? (raw as StudentData) : null;
  } catch (error) {
    console.error('ZXQ kv.loadStudentData error:', error);
    return null;
  }
}

export async function saveStudentData(doc: StudentData): Promise<void> {
  try {
    await kv.set(KEY, doc);
    const json = JSON.stringify(doc);
    console.info(`ZXQ kv.saveStudentData: SAVED - ${json.length} bytes to Upstash Redis`);
  } catch (error) {
    console.error('ZXQ kv.saveStudentData error:', error);
    throw error;
  }
}

// Simple get/set for test data
export async function get(key: string): Promise<string | null> {
  try {
    const result = await kv.get(key);
    
    // Handle different return types from @vercel/kv
    let stringResult: string | null = null;
    if (result) {
      if (typeof result === 'string') {
        stringResult = result;
      } else if (typeof result === 'object') {
        // If it's an object, try to stringify it properly
        stringResult = JSON.stringify(result);
      } else {
        stringResult = String(result);
      }
    }
    
    console.info(`ZXQ kv.get(${key}): ${stringResult ? 'FOUND' : 'NOT_FOUND'} - ${stringResult ? stringResult.length : 0} bytes`);
    
    // DEBUG: Show first 100 chars of what we actually retrieved
    if (stringResult && stringResult.length < 1000) {
      console.info(`ZXQ DEBUG: Retrieved data preview: ${stringResult.substring(0, 100)}...`);
    }
    
    return stringResult;
  } catch (error) {
    console.error(`ZXQ kv.get(${key}) error:`, error);
    return null;
  }
}

export async function set(key: string, value: string): Promise<void> {
  try {
    // Ensure we're storing a proper JSON string, not "[object Object]"
    const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
    await kv.set(key, jsonString);
    console.info(`ZXQ kv.set(${key}): SAVED - ${jsonString.length} bytes to Upstash Redis`);
  } catch (error) {
    console.error(`ZXQ kv.set(${key}) error:`, error);
    throw error;
  }
}

export async function saveMetadata(metadata: any): Promise<void> {
  await kv.set('metadata:v1', JSON.stringify(metadata));
}

export async function getMetadata(): Promise<any> {
  const data = await get('metadata:v1');
  return data ? JSON.parse(data) : null;
}
