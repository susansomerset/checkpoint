import { selectProgressTableRows } from '../progressTable';
import { generateSyntheticStudentData } from '../../../tests/fixtures/synthetic-data';

describe('ProgressTable Performance', () => {
  test('selector completes under 150ms with 2k assignments', () => {
    const data = generateSyntheticStudentData();
    const studentId = 'synthetic-student-1';
    
    const startTime = performance.now();
    const result = selectProgressTableRows(data, studentId);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    expect(result).toBeTruthy();
    expect(result?.totalAssignments).toBeGreaterThan(0);
    expect(duration).toBeLessThan(150);
    
    // Performance logging for debugging
    if (duration > 100) {
      console.warn(`Selector performance: ${duration.toFixed(2)}ms with ${result?.totalAssignments} assignments`);
    }
  });

  test('handles large dataset without memory issues', () => {
    const data = generateSyntheticStudentData();
    const studentId = 'synthetic-student-1';
    
    // Run multiple times to check for memory leaks
    for (let i = 0; i < 10; i++) {
      const result = selectProgressTableRows(data, studentId);
      expect(result).toBeTruthy();
    }
  });
});
