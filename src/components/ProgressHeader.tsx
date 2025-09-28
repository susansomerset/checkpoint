"use client";

import { useMemo } from "react";
import { useStudent } from "@/contexts/StudentContext";
import ProgressRadial from "./ProgressRadial.client";

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

  if (loading) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Loading progress data...</div>
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
            
            const earnedPercentage = progress.total > 0 
              ? Math.round((progress.earned / progress.total) * 100)
              : 0;

            const submittedPercentage = progress.total > 0 
              ? Math.round((progress.submitted / progress.total) * 100)
              : 0;

            const missingPercentage = progress.total > 0 
              ? Math.round((progress.missing / progress.total) * 100)
              : 0;

            const lostPercentage = progress.total > 0 
              ? Math.round((progress.lost / progress.total) * 100)
              : 0;

            // Create the series data for the radial chart
            const series = [
              earnedPercentage,
              submittedPercentage,
              missingPercentage,
              lostPercentage
            ];

            const labels = ['Earned', 'Submitted', 'Missing', 'Lost'];
            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

            return (
              <ProgressRadial
                key={course.courseId}
                series={series}
                labels={labels}
                colors={colors}
                title={`Period ${course.period}`}
                subtitle={course.courseName}
                showPercentage={true}
                showCheckmark={progress.missing === 0 && progress.total > 0}
                className="w-full"
                testMode={process.env.NODE_ENV === 'test'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProgressHeader;
