"use client";

import { useMemo, useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";
import HeaderChart, { HeaderSegment } from "./HeaderChart";

interface ProgressData {
  earned: number;
  submitted: number;
  missing: number;
  lost: number;
  total: number;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  period: number;
  progress: ProgressData;
}

function ProgressHeader() {
  const { selectedStudentId, data, loading, error } = useStudent();
  const [fontsReady, setFontsReady] = useState(false);

  // Wait for fonts before rendering charts
  useEffect(() => {
    if (document?.fonts?.ready) {
      document.fonts.ready.then(() => setFontsReady(true));
    } else {
      setFontsReady(true);
    }
  }, []);

  const courseProgress = useMemo((): CourseProgress[] => {
    if (!data || !selectedStudentId) return [];

    const student = data.students[selectedStudentId];
    if (!student) return [];

    return Object.values(student.courses)
      .filter(course => course.meta.period && course.meta.period <= 6) // Only periods 1-6
      .map(course => {
        const assignments = Object.values(course.assignments)
          .filter(assignment => assignment.meta.assignmentType !== 'Vector'); // Exclude Vector assignments

        const progress: ProgressData = {
          earned: 0,
          submitted: 0,
          missing: 0,
          lost: 0,
          total: 0
        };

        assignments.forEach(assignment => {
          const points = assignment.pointsPossible || 0;
          const status = assignment.meta.checkpointStatus;
          
          progress.total += points;

          switch (status) {
            case 'Graded':
              progress.earned += points;
              progress.submitted += points;
              break;
            case 'Submitted':
              progress.submitted += points;
              break;
            case 'Missing':
              progress.missing += points;
              break;
            case 'Due':
              // Due assignments are not yet missing, so they don't count as missing points
              break;
            default:
              // Other statuses don't contribute to the progress calculation
              break;
          }
        });

        // Calculate lost points (total possible - earned)
        progress.lost = Math.max(0, progress.total - progress.earned);

        return {
          courseId: course.courseId,
          courseName: course.meta.shortName || course.canvas.name,
          period: course.meta.period || 0,
          progress
        };
      })
      .sort((a, b) => a.period - b.period); // Sort by period
  }, [data, selectedStudentId]);

  if (loading || !fontsReady) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">
              {loading ? 'Loading progress data...' : 'Loading fonts...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-red-500">Error loading progress data: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStudentId || courseProgress.length === 0) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">No progress data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {courseProgress.map((course) => {
            const { progress } = course;
            // const turnedInPercentage = progress.total > 0 
            //   ? Math.round(((progress.earned + progress.submitted) / progress.total) * 100)
            //   : 0;
            
            // Calculate total for normalization (used in segments calculation)
            // const total = progress.earned + progress.submitted + progress.missing + progress.lost;

            // Create segments for HeaderChart (using points for correctness)
            const segments: HeaderSegment[] = [
              { label: "Earned", color: "#22c55e", points: progress.earned },
              { label: "Submitted", color: "#3b82f6", points: progress.submitted },
              { label: "Missing", color: "#ef4444", points: progress.missing },
              { label: "Lost", color: "#0f172a", points: progress.lost }
            ];

            return (
              <HeaderChart
                key={course.courseId}
                segments={segments}
                centerLabel={`Period ${course.period}`}
                centerSubLabel={course.courseName}
                sizePx={200}
                className="w-full"
                showTooltip={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProgressHeader;
