export type RootKeys = 'studentData' | 'metaData' | 'lastLoadedAt';

export type Id = string; // Canvas ids come as strings; keep them that way

// Atomic write contract (implementation in Step 3)
export interface AtomicWriter {
  saveStudentDataAtomically: (_draft: import('../student/schema').StudentData) => Promise<void>;
  setMetaData: (_meta: import('../meta/schema').MetaData) => Promise<void>;
  getStudentData: () => Promise<import('../student/schema').StudentData | null>;
  getMetaData: () => Promise<import('../meta/schema').MetaData | null>;
  getLastLoadedAt: () => Promise<string | null>;
}
