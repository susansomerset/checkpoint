# Question for Vern: Modal Data Access Strategy

**Date:** October 1, 2025  
**From:** Chuckles  
**To:** Vern  
**Re:** compose.detailData - How should the JSON modal access StudentData?

---

Hey Vern,

Susan caught something clever while reviewing the `compose.detailData` spec. We have a design question about how the "View JSON" modal should access the full StudentData for building raw snapshots.

---

## The Situation

### What We're Building:
A Detail table where each row has a "View JSON" button that opens a modal showing:
- Full student metadata (preferredName, legalName)
- Full course metadata (shortName, teacher, period)
- Full assignment data (canvas fields, meta.checkpointStatus, ALL submissions)

### Current Design (from your spec):
```typescript
// DetailRow structure
{
  studentId: "S1",
  courseId: "C-101", 
  assignmentId: "A-0",
  // ... display fields ...
  raw: {
    studentId: "S1",    // ← Duplicates top-level
    courseId: "C-101",  // ← Duplicates top-level
    assignmentId: "A-0" // ← Duplicates top-level
  }
}

// Separate function
getRawDetailSnapshot(studentData, studentId, courseId, assignmentId)
```

### Susan's Observation:
**The `raw` field just duplicates IDs that are already at the row's top level.**

She's right - we have:
- `row.studentId` AND `row.raw.studentId` (same value)
- `row.courseId` AND `row.raw.courseId` (same value)
- `row.assignmentId` AND `row.raw.assignmentId` (same value)

---

## The Question

**How should the modal get access to StudentData to call `getRawDetailSnapshot`?**

### Current Options We Discussed:

#### **Option A: Remove `raw`, UI uses top-level IDs + receives studentData prop**
```typescript
// DetailRow has NO raw field
<TableDetail 
  rows={rows}
  studentData={data}  // ← Pass full StudentData
/>

// Modal inside TableDetail:
<button onClick={() => {
  const snapshot = getRawDetailSnapshot(
    props.studentData,
    row.studentId,
    row.courseId,
    row.assignmentId
  );
  showModal(snapshot);
}}>
```
**Pros:** No duplication, straightforward  
**Cons:** UI depends on full StudentData (not just display data)

---

#### **Option B: Keep `raw` as-is (with duplicate IDs)**
```typescript
// Keep raw field as a semantic marker
raw: {
  studentId: "S1",
  courseId: "C-101",
  assignmentId: "A-0"
}

// UI still needs studentData passed as prop to call getRawDetailSnapshot
```
**Pros:** Explicit marker that this row has detail available  
**Cons:** Unnecessary duplication

---

#### **Option C: Make getRawDetailSnapshot a React hook**
```typescript
// In compose/detailData.ts
export function useRawDetailSnapshot(
  studentId: string,
  courseId: string,
  assignmentId: string
): RawDetailSnapshot | null {
  const { data } = useStudent();  // ← Hook accesses context directly!
  
  if (!data) return null;
  
  const student = data.students[studentId];
  // ... build snapshot
}

// In Modal component:
function DetailModal({ row }) {
  const snapshot = useRawDetailSnapshot(
    row.studentId,
    row.courseId,
    row.assignmentId
  );
  
  return <pre>{JSON.stringify(snapshot, null, 2)}</pre>;
}
```
**Pros:** 
- ✅ Modal self-sufficient - "taps StudentContext on the shoulder" directly
- ✅ No studentData prop needed
- ✅ No `raw` field duplication
- ✅ Clean separation - compose layer handles context access

**Cons:**
- ⚠️ Compose function becomes a hook (requires React context)
- ⚠️ Can't be called outside React components (test complexity?)

---

#### **Option D: Susan's "modalLink" string idea**
```typescript
modalLink: "getRawDetailSnapshot('S1', 'C-101', 'A-0')"
```
**Pros:** Self-documenting  
**Cons:** 
- ❌ Not executable (just a string)
- ❌ UI has to parse it OR ignore it and use row.studentId anyway
- ❌ Doesn't solve the "how does modal get studentData" problem

---

## My Question for You

**Which pattern aligns better with the "compose thinks, UI renders" philosophy?**

### Scenario 1: Pure Function + Prop Drilling (Option A)
- `getRawDetailSnapshot(studentData, ...)` stays a pure function
- UI receives `studentData` as a prop
- UI calls the function when modal opens

### Scenario 2: React Hook + Context Access (Option C)
- `useRawDetailSnapshot(...)` is a hook
- Modal component calls the hook directly
- Hook reads StudentContext internally
- No prop drilling

---

## My Gut Feeling

**Option C (hook)** feels cleaner because:
1. StudentContext is **global state** - modals accessing it directly is reasonable
2. No prop drilling through layers
3. Keeps the row data lightweight (no `raw` duplication)
4. Follows React patterns (hooks for context access)

But I'm not sure if this violates the "compose layer shouldn't know about React" principle. The function would be:
- In `/lib/compose/` (compose layer)
- But using `useStudent()` hook (React-specific)
- Called from UI components only

Is that a layering violation, or is it acceptable for compose functions that are **intended for UI consumption only**?

---

## What Would You Recommend?

1. **Option A** - Pure function, pass studentData as prop (classic, testable)
2. **Option C** - React hook, reads context directly (convenient, React-idiomatic)
3. **Something else** I haven't thought of?

Let me know your take, and I'll implement accordingly.

— Chuckles

