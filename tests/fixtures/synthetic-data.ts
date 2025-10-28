import { StudentData, Student, Course, Assignment } from '@/lib/contracts/types';

/**
 * Generate synthetic test data for performance testing and edge cases.
 */

export function generateSyntheticStudentData(): StudentData {
  const studentId = 'synthetic-student-1';
  const courseId = 'synthetic-course-1';
  
  // Generate 2000 assignments for performance testing
  const assignments: Record<string, Assignment> = {};
  
  for (let i = 1; i <= 2000; i++) {
    const statuses = ['Missing', 'Submitted (Late)', 'Submitted', 'Graded', 'Vector'];
    const status = statuses[i % statuses.length];
    const isVector = status === 'Vector';
    
    assignments[`assignment-${i}`] = {
      assignmentId: `assignment-${i}`,
      courseId,
      studentId,
      canvas: {
        name: `Assignment ${i}`,
        due_at: i % 3 === 0 ? null : new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        points_possible: Math.floor(Math.random() * 100) + 10,
        html_url: `https://canvas.instructure.com/courses/${courseId}/assignments/assignment-${i}`
      },
      pointsPossible: Math.floor(Math.random() * 100) + 10,
      link: `https://canvas.instructure.com/courses/${courseId}/assignments/assignment-${i}`,
      submissions: {},
      meta: {
        title: `Assignment ${i}`,
        dueDate: i % 3 === 0 ? undefined : new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        pointValue: Math.floor(Math.random() * 100) + 10,
        checkpointStatus: status as any,
        checkpointEarnedPoints: isVector ? 0 : Math.floor(Math.random() * 100),
        checkpointSubmittedPoints: isVector ? 0 : Math.floor(Math.random() * 100),
        checkpointMissingPoints: isVector ? 0 : Math.floor(Math.random() * 100),
        checkpointLostPoints: isVector ? 0 : Math.floor(Math.random() * 100),
        assignmentType: isVector ? 'Vector' : 'Pointed'
      }
    };
  }

  const course: Course = {
    courseId,
    canvas: {},
    meta: {
      legalName: 'Synthetic Test Course',
      shortName: 'SYNTH',
      teacher: 'Test Teacher',
      period: 1
    },
    assignments
  };

  const student: Student = {
    studentId,
    meta: {
      legalName: 'Synthetic Test Student',
      preferredName: 'Test Student'
    },
    courses: {
      [courseId]: course
    }
  };

  return {
    version: 1,
    students: {
      [studentId]: student
    }
  };
}

export function generateVectorOnlyCourseData(): StudentData {
  const studentId = 'vector-student-1';
  const courseId = 'vector-course-1';
  
  const assignments: Record<string, Assignment> = {};
  
  // Generate 10 Vector assignments only
  for (let i = 1; i <= 10; i++) {
    assignments[`vector-assignment-${i}`] = {
      assignmentId: `vector-assignment-${i}`,
      courseId,
      studentId,
      canvas: {
        name: `Vector Assignment ${i}`,
        due_at: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        points_possible: 100,
        html_url: `https://canvas.instructure.com/courses/${courseId}/assignments/vector-assignment-${i}`
      },
      pointsPossible: 100,
      link: `https://canvas.instructure.com/courses/${courseId}/assignments/vector-assignment-${i}`,
      submissions: {},
      meta: {
        title: `Vector Assignment ${i}`,
        dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        pointValue: 100,
        checkpointStatus: 'Vector',
        checkpointEarnedPoints: 0,
        checkpointSubmittedPoints: 0,
        checkpointMissingPoints: 0,
        checkpointLostPoints: 0,
        assignmentType: 'Vector'
      }
    };
  }

  const course: Course = {
    courseId,
    canvas: {},
    meta: {
      legalName: 'Vector Only Course',
      shortName: 'VECTOR',
      teacher: 'Vector Teacher',
      period: 2
    },
    assignments
  };

  const student: Student = {
    studentId,
    meta: {
      legalName: 'Vector Test Student',
      preferredName: 'Vector Student'
    },
    courses: {
      [courseId]: course
    }
  };

  return {
    version: 1,
    students: {
      [studentId]: student
    }
  };
}

export function generateAllStatusesData(): StudentData {
  const studentId = 'all-statuses-student-1';
  const courseId = 'all-statuses-course-1';
  
  const assignments: Record<string, Assignment> = {};
  
  // Generate one assignment for each status
  const statuses = [
    { status: 'Missing', earned: 0, possible: 100 },
    { status: 'Submitted (Late)', earned: 85, possible: 100 },
    { status: 'Submitted', earned: 95, possible: 100 },
    { status: 'Graded', earned: 100, possible: 100 },
    { status: 'Vector', earned: 0, possible: 100 } // Should be filtered out
  ];
  
  statuses.forEach((statusData, index) => {
    assignments[`status-assignment-${index + 1}`] = {
      assignmentId: `status-assignment-${index + 1}`,
      courseId,
      studentId,
      canvas: {
        name: `${statusData.status} Assignment`,
        due_at: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString(),
        points_possible: statusData.possible,
        html_url: `https://canvas.instructure.com/courses/${courseId}/assignments/status-assignment-${index + 1}`
      },
      pointsPossible: statusData.possible,
      link: `https://canvas.instructure.com/courses/${courseId}/assignments/status-assignment-${index + 1}`,
      submissions: {},
      meta: {
        title: `${statusData.status} Assignment`,
        dueDate: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString(),
        pointValue: statusData.possible,
        checkpointStatus: statusData.status as any,
        checkpointEarnedPoints: statusData.earned,
        checkpointSubmittedPoints: statusData.earned,
        checkpointMissingPoints: statusData.possible - statusData.earned,
        checkpointLostPoints: 0,
        assignmentType: statusData.status === 'Vector' ? 'Vector' : 'Pointed'
      }
    };
  });

  const course: Course = {
    courseId,
    canvas: {},
    meta: {
      legalName: 'All Statuses Course',
      shortName: 'ALLSTAT',
      teacher: 'Status Teacher',
      period: 3
    },
    assignments
  };

  const student: Student = {
    studentId,
    meta: {
      legalName: 'All Statuses Student',
      preferredName: 'Status Student'
    },
    courses: {
      [courseId]: course
    }
  };

  return {
    version: 1,
    students: {
      [studentId]: student
    }
  };
}
