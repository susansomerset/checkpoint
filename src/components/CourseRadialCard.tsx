// components/CourseRadialCard.tsx
// Component that uses the new selector system for radial charts

"use client";

import { useStudent } from '@/contexts/StudentContext';
import { getRadialVM } from '@/selectors/cache';
import OriginalHeaderChart from './OriginalHeaderChart';

interface CourseRadialCardProps {
  studentId: string;
  courseId: string;
  label: string;
  teacher: string;
}

export function CourseRadialCard({ studentId, courseId, label, teacher }: CourseRadialCardProps) {
  const ctx = useStudent();
  if (!ctx?.data) return null;

  const vm = getRadialVM(ctx.data, studentId, courseId);

  // Check if all values are 0 (free period) - show green checkmark
  const totalPoints = vm.segments.reduce((sum, segment) => sum + segment.points, 0);
  const isFreePeriod = totalPoints === 0;

  return (
    <OriginalHeaderChart
      sizePx={150}
      centerLabel={label}
      centerSubLabel={teacher}
      segments={vm.segments.map(s => ({
        label: s.label,
        color: s.color,
        points: s.points,
        percentage: s.percentage,
      }))}
      centerValue={isFreePeriod ? "100" : vm.centerPercent.toString()}
      showTooltip={true}
    />
  );
}
