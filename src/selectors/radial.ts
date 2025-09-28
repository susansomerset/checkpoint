// selectors/radial.ts
// Pure functions for computing radial chart data from raw student data

export type Bucket = "Earned" | "Submitted" | "Missing" | "Lost";

export type BucketsPoints = Record<Bucket, number>;

export type HeaderSegment = {
  label: Bucket;
  color: string;
  points: number;      // keep points as base unit
  percentage: number;  // 0..100 within the ring (normalized)
};

export type HeaderRadialVM = {
  segments: HeaderSegment[];   // normalized, contiguous
  centerPercent: number;       // turned-in = total - Missing
};

const COLORS: Record<Bucket, string> = {
  Earned:    "#22c55e",
  Submitted: "#3b82f6",
  Missing:   "#ef4444",
  Lost:      "#0f172a",
};

// Core math: compute buckets from raw student+course data
export function bucketsForCourse(student: any, courseId: string): BucketsPoints {
  const course = student?.courses?.[courseId];
  if (!course?.assignments) {
    return { Earned: 0, Submitted: 0, Missing: 0, Lost: 0 };
  }

  let earned = 0;
  let submitted = 0;
  let missing = 0;
  let lost = 0;

  // Iterate through assignments and sum up points by status
  Object.values(course.assignments).forEach((assignment: any) => {
    const meta = assignment.meta;
    if (!meta) return;

    // Skip Vector assignments - they should not be included in radial calculations
    if (meta.assignmentType === 'Vector') return;

    // Use the checkpointStatus from the backend
    switch (meta.checkpointStatus) {
      case 'Graded':
        earned += meta.checkpointEarnedPoints || 0;
        break;
      case 'Submitted':
        submitted += meta.checkpointSubmittedPoints || 0;
        break;
      case 'Missing':
        missing += meta.checkpointMissingPoints || 0;
        break;
      case 'Lost':
        lost += meta.checkpointLostPoints || 0;
        break;
      default:
        // Handle other statuses as needed
        break;
    }
  });

  return { 
    Earned: earned, 
    Submitted: submitted, 
    Missing: missing, 
    Lost: lost 
  };
}

export function radialVMFromBuckets(b: BucketsPoints): HeaderRadialVM {
  const total = Math.max(0, b.Earned + b.Submitted + b.Missing + b.Lost);
  const center = total > 0 ? Math.round(((total - b.Missing) / total) * 100) : 0;

  // Normalize to 100 so the stacked ring is contiguous:
  const denom = total > 0 ? total : 1;
  const segs: HeaderSegment[] = (["Earned","Submitted","Missing","Lost"] as Bucket[]).map(label => {
    const points = b[label];
    const pct = (points / denom) * 100;
    return { label, color: COLORS[label], points, percentage: pct };
  });

  return { segments: segs, centerPercent: clamp0to100(center) };
}

const clamp0to100 = (n: number) => Math.max(0, Math.min(100, n));
