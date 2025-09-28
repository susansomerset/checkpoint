import React, { useState, useEffect } from 'react';
import SpeedometerChart, { SpeedometerSegment } from './SpeedometerChart';
import { ProcessedAssignment, AssignmentStatus } from '../types/canvas';
import { getCoursePreferences } from '../utils/coursePreferences';
import { getPreferredNames } from '../utils/preferredNames';

interface ChartTestViewProps {
  data: ProcessedAssignment[];
  selectedStudent: string;
  isLoading?: boolean;
}

interface CourseChartData {
  courseId: number;
  className: string;
  shortName: string;
  teacherName: string;
  period: number;
  segments: SpeedometerSegment[];
  centerLabel: string;
  centerValue: string;
}

const ChartTestView: React.FC<ChartTestViewProps> = ({ data, selectedStudent, isLoading = false }) => {
  const [coursePreferences, setCoursePreferences] = useState<{[courseId: number]: { shortName: string; teacherName: string; period: number }}>({});
  const [preferredNames, setPreferredNames] = useState<{[legalName: string]: string}>({});
  const [courseCharts, setCourseCharts] = useState<CourseChartData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [preferences, names] = await Promise.all([
          getCoursePreferences(),
          getPreferredNames()
        ]);
        setCoursePreferences(preferences);
        setPreferredNames(names);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (data.length === 0 || !selectedStudent) {
      setCourseCharts([]);
      return;
    }

    // Filter assignments for the selected student
    const studentAssignments = data.filter(assignment => {
      const studentName = preferredNames[assignment.studentName] || assignment.studentName;
      return studentName === selectedStudent;
    });

    // Group by course
    const courseMap = new Map<number, ProcessedAssignment[]>();
    studentAssignments.forEach(assignment => {
      if (!courseMap.has(assignment.courseId)) {
        courseMap.set(assignment.courseId, []);
      }
      courseMap.get(assignment.courseId)!.push(assignment);
    });

    const charts: CourseChartData[] = [];

    courseMap.forEach((assignments, courseId) => {
      // Get course info
      const preference = coursePreferences[courseId];
      const className = assignments[0].className;
      const shortName = preference?.shortName || className;
      const teacherName = preference?.teacherName || assignments[0].teacherName;
      const period = preference?.period || parseInt(assignments[0].classPeriod) || 999;

      // Use the same logic as ProgressView table
      let pointsPossible = 0;
      let pointsEarned = 0;
      let pointsSubmitted = 0;
      let pointsMissing = 0;
      let pointsLost = 0;

      // Group assignments by status first
      const statusGroups = new Map<string, ProcessedAssignment[]>();
      assignments.forEach(assignment => {
        if (!statusGroups.has(assignment.status)) {
          statusGroups.set(assignment.status, []);
        }
        statusGroups.get(assignment.status)!.push(assignment);
      });

      // Process each status group using ProgressView logic
      statusGroups.forEach((groupAssignments, status) => {
        const groupTotalPossible = groupAssignments.reduce((sum, a) => sum + (a.pointValue || 0), 0);
        const groupTotalEarned = groupAssignments.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

        if (status === 'Graded') {
          // Graded assignments: count both possible and earned points
          pointsPossible += groupTotalPossible;
          pointsEarned += groupTotalEarned;
          // Calculate lost points for graded assignments
          pointsLost += groupTotalPossible - groupTotalEarned;
        } else if (status === 'Submitted' || status === 'Submitted (Late)') {
          // Submitted but not graded: count possible points as submitted
          pointsPossible += groupTotalPossible; // Include in total possible
          pointsSubmitted += groupTotalPossible;
        } else if (status === 'Missing') {
          // Missing assignments: count possible points as missing
          pointsPossible += groupTotalPossible; // Include in total possible
          pointsMissing += groupTotalPossible;
        }
      });

      // Calculate percentages (rounded up, max 100)
      const earnedPercentage = pointsPossible > 0 ? Math.min(Math.ceil((pointsEarned / pointsPossible) * 100), 100) : 0;
      const submittedPercentage = pointsPossible > 0 ? Math.min(Math.ceil((pointsSubmitted / pointsPossible) * 100), 100) : 0;
      const missingPercentage = pointsPossible > 0 ? Math.min(Math.ceil((pointsMissing / pointsPossible) * 100), 100) : 0;
      const lostPercentage = pointsPossible > 0 ? Math.min(Math.ceil((pointsLost / pointsPossible) * 100), 100) : 0;

      // Create segments with consistent saturation (74% to match green checkmark)
      const segments: SpeedometerSegment[] = [
        { label: 'Earned', percentage: earnedPercentage, color: 'hsl(160, 74%, 39%)', points: pointsEarned }, // Green
        { label: 'Submitted', percentage: submittedPercentage, color: 'hsl(217, 74%, 60%)', points: pointsSubmitted }, // Blue
        { label: 'Missing', percentage: missingPercentage, color: 'hsl(0, 74%, 60%)', points: pointsMissing }, // Red
        { label: 'Lost', percentage: lostPercentage, color: 'hsl(220, 74%, 27%)', points: pointsLost } // Dark Grey
      ];

      // Calculate center value (Earned + Lost + Submitted as percentage of total possible, then round up)
      // Lost points are still "turned in" work - they were submitted and graded
      const turnedInPoints = pointsEarned + pointsLost + pointsSubmitted;
      const turnedInPercentage = pointsPossible > 0 ? Math.min(Math.ceil((turnedInPoints / pointsPossible) * 100), 100) : 0;

      // Debug logging
      console.log(`Course: ${shortName}`, {
        pointsEarned,
        pointsSubmitted,
        pointsPossible,
        earnedPercentage,
        submittedPercentage,
        turnedInPercentage
      });

      charts.push({
        courseId,
        className,
        shortName,
        teacherName,
        period,
        segments,
        centerLabel: `${period} ${shortName}`,
        centerValue: `${turnedInPercentage}`
      });
    });

    // Sort by period
    charts.sort((a, b) => a.period - b.period);

    setCourseCharts(charts);
  }, [data, selectedStudent, coursePreferences, preferredNames]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Chart Test</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading charts...</div>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Chart Test</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Please select a student to view course charts</div>
        </div>
      </div>
    );
  }

  if (courseCharts.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Chart Test</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">No course data available for {selectedStudent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Progress Charts - {selectedStudent}</h1>
      
      {/* Header Cards with Individual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {courseCharts.map((course) => (
          <div key={`header-${course.courseId}`} className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="flex justify-center">
                <SpeedometerChart
                  segments={course.segments}
                  centerLabel={course.centerLabel}
                  centerSubLabel={course.teacherName}
                  centerValue={course.centerValue}
                size={250}
                strokeWidth={60}
                  showTooltip={true}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact 6-Column Grid */}
      <div className="grid grid-cols-6 gap-2">
        {courseCharts.map((course) => (
          <div key={course.courseId} className="bg-white rounded-lg shadow p-2">
            <div className="flex justify-center">
              <SpeedometerChart
                segments={course.segments}
                centerLabel={course.centerLabel}
                centerSubLabel={course.teacherName}
                centerValue={course.centerValue}
                size={250}
                strokeWidth={60}
                showTooltip={true}
              />
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartTestView;