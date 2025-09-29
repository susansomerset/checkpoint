import { isDisplayAssignment } from '../isDisplayAssignment';
import { Assignment } from '@/lib/contracts/types';

describe('isDisplayAssignment', () => {
  const createAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
    assignmentId: 'test-assignment',
    courseId: 'test-course',
    studentId: 'test-student',
    meta: {
      title: 'Test Assignment',
      pointValue: 100,
      checkpointStatus: 'Graded',
      checkpointEarnedPoints: 85,
      checkpointSubmittedPoints: 85,
      checkpointMissingPoints: 15,
      checkpointLostPoints: 0,
      assignmentType: 'Pointed',
      ...overrides.meta
    },
    ...overrides
  });

  test('excludes Vector assignments', () => {
    const assignment = createAssignment({
      meta: { assignmentType: 'Vector' }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(false);
  });

  test('includes graded assignments', () => {
    const assignment = createAssignment({
      meta: { checkpointStatus: 'Graded' }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(true);
  });

  test('includes submitted assignments', () => {
    const assignment = createAssignment({
      meta: { checkpointStatus: 'Submitted' }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(true);
  });

  test('includes missing assignments with past due date', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const assignment = createAssignment({
      meta: { 
        checkpointStatus: 'Missing',
        dueDate: pastDate
      }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(true);
  });

  test('excludes missing assignments with future due date', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const assignment = createAssignment({
      meta: { 
        checkpointStatus: 'Missing',
        dueDate: futureDate
      }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(false);
  });

  test('excludes missing assignments without due date', () => {
    const assignment = createAssignment({
      meta: { 
        checkpointStatus: 'Missing',
        dueDate: undefined
      }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(false);
  });

  test('excludes other statuses', () => {
    const assignment = createAssignment({
      meta: { checkpointStatus: 'Locked' }
    });
    
    expect(isDisplayAssignment(assignment)).toBe(false);
  });
});
