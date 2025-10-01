/**
 * Unit tests for compose.detailData
 * Spec: spec/current.json
 */

import { getSelectedDetail, getRawDetailSnapshot } from '../../../src/lib/compose/detailData';

describe('compose.detailData', () => {
  const mockStudentData = {
    students: {
      'S1': {
        studentId: 'S1',
        meta: { preferredName: 'Alice', legalName: 'Alice Johnson' },
        courses: {
          'C1': {
            courseId: 'C1',
            meta: { shortName: 'Math', period: '1', teacher: 'Mr. Smith' },
            canvas: { name: 'Mathematics' },
            assignments: {
              'A1': {
                assignmentId: 'A1',
                courseId: 'C1',
                canvas: { name: 'Quiz', html_url: 'https://example.com/a1' },
                meta: { checkpointStatus: 'Missing' },
                pointsPossible: 10,
                link: 'https://example.com/a1',
                submissions: {
                  'SUB1': { graded_points: 5, submitted_at: '2025-09-01T12:00:00Z' }
                }
              }
            }
          }
        }
      }
    }
  };

  describe('getSelectedDetail', () => {
    it('returns empty rows with headers when no selectedStudentId', () => {
      const result = getSelectedDetail({
        selectedStudentId: null,
        data: mockStudentData
      });

      expect(result.rows).toEqual([]);
      expect(result.selectedStudentId).toBe('');
      expect(result.headers).toHaveLength(11);
    });

    it('returns empty rows with headers when selectedStudent not found', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S999',
        data: mockStudentData
      });

      expect(result.rows).toEqual([]);
      expect(result.selectedStudentId).toBe('S999');
      expect(result.headers).toHaveLength(11);
    });

    it('returns empty rows when studentContext data missing students key', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S1',
        data: {}
      });

      expect(result.rows).toEqual([]);
      expect(result.selectedStudentId).toBe('S1'); // Still returns the ID even though data invalid
      expect(result.headers).toHaveLength(11);
    });

    it('delegates to getDetailRows when student exists', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S1',
        data: mockStudentData
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].studentId).toBe('S1');
      expect(result.rows[0].assignmentId).toBe('A1');
      expect(result.selectedStudentId).toBe('S1');
    });

    it('includes static headers array with 11 items', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S1',
        data: mockStudentData
      });

      expect(result.headers).toEqual([
        'Student','Course','Teacher','Assignment','Status',
        'Points','Grade','%','Due','Turned in','Graded on'
      ]);
    });

    it('returns selectedStudentId in output', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S1',
        data: mockStudentData
      });

      expect(result.selectedStudentId).toBe('S1');
    });

    it('detail rows do not include raw field', () => {
      const result = getSelectedDetail({
        selectedStudentId: 'S1',
        data: mockStudentData
      });

      expect(result.rows[0]).not.toHaveProperty('raw');
      // IDs at top level instead
      expect(result.rows[0].studentId).toBe('S1');
      expect(result.rows[0].courseId).toBe('C1');
      expect(result.rows[0].assignmentId).toBe('A1');
    });
  });

  describe('getRawDetailSnapshot', () => {
    it('returns null when ids invalid', () => {
      const result = getRawDetailSnapshot(mockStudentData, 'S999', 'C1', 'A1');
      expect(result).toBeNull();
    });

    it('includes assignment meta with checkpointStatus', () => {
      const result = getRawDetailSnapshot(mockStudentData, 'S1', 'C1', 'A1');

      expect(result).not.toBeNull();
      expect(result?.assignment.meta).toEqual({ checkpointStatus: 'Missing' });
    });

    it('includes all submissions not just first', () => {
      const result = getRawDetailSnapshot(mockStudentData, 'S1', 'C1', 'A1');

      expect(result?.assignment.submissions).toBeDefined();
      expect(Object.keys(result?.assignment.submissions || {})).toContain('SUB1');
    });

    it('excludes nested courses and assignments', () => {
      const result = getRawDetailSnapshot(mockStudentData, 'S1', 'C1', 'A1');

      expect(result?.student).not.toHaveProperty('courses');
      expect(result?.course).not.toHaveProperty('assignments');
    });

    it('returns null when assignment missing but student and course exist', () => {
      const result = getRawDetailSnapshot(mockStudentData, 'S1', 'C1', 'A404');

      expect(result).toBeNull();
    });
  });
});

