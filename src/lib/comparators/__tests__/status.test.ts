import { STATUS_PRIORITY, compareStatus } from '../status';

describe('STATUS_PRIORITY', () => {
  test('maintains exact order and never changes', () => {
    // Snapshot test to catch any accidental reordering
    expect(STATUS_PRIORITY).toMatchSnapshot();
    
    // Explicit order verification
    expect(STATUS_PRIORITY).toEqual([
      'Missing',
      'Submitted (Late)', 
      'Submitted',
      'Graded'
    ]);
  });

  test('compareStatus respects priority order', () => {
    // Test all combinations to ensure proper ordering
    expect(compareStatus('Missing', 'Submitted (Late)')).toBeLessThan(0);
    expect(compareStatus('Submitted (Late)', 'Submitted')).toBeLessThan(0);
    expect(compareStatus('Submitted', 'Graded')).toBeLessThan(0);
    
    // Test reverse order
    expect(compareStatus('Graded', 'Missing')).toBeGreaterThan(0);
    expect(compareStatus('Submitted', 'Submitted (Late)')).toBeGreaterThan(0);
    
    // Test equal status
    expect(compareStatus('Missing', 'Missing')).toBe(0);
    
    // Test unknown status (should sort last)
    expect(compareStatus('Unknown', 'Missing')).toBeGreaterThan(0);
    expect(compareStatus('Graded', 'Unknown')).toBeLessThan(0);
  });
});
