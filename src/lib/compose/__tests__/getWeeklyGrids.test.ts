/**
 * Unit tests for processing.getWeeklyGrids v1.0.0
 * Spec: spec/current.json
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getWeeklyGrids } from '../getWeeklyGrids';
import twoStudentsSmall from '../../../../tests/fixtures/processing.getWeeklyGrids/two_students_small.json';

describe('processing.getWeeklyGrids', () => {
  describe('builds_two_student_grids', () => {
    it('returns object indexed by studentId', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      expect(Object.keys(result).length).toBe(2);
      expect(result['S1']).toBeDefined();
      expect(result['S2']).toBeDefined();
    });
  });

  describe('weekday_bucketting_tz_aware', () => {
    it('places assignments in correct weekday buckets', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      const s1Grid = result['S1'].grid;
      const s1Row = s1Grid.rows[0];
      
      // A-0 (due 10/2, Missing, before week) → Prior
      expect(s1Row.cells.prior.length).toBeGreaterThan(0);
      expect(s1Row.cells.prior[0].id).toBe('A-0');
      
      // A-1 (due 10/3, Submitted, before week) → excluded (not in Prior)
      // Prior should only have A-0
      expect(s1Row.cells.prior.length).toBe(1);
      
      // A-2 (due 10/7 Tue) → Tue
      expect(s1Row.cells.weekday.Tue.length).toBeGreaterThan(0);
      expect(s1Row.cells.weekday.Tue[0].id).toBe('A-2');
      
      // A-3 (due 10/10 Fri) → Fri
      expect(s1Row.cells.weekday.Fri.length).toBeGreaterThan(0);
      expect(s1Row.cells.weekday.Fri[0].id).toBe('A-3');
      
      // A-5 (due 10/14 Tue next week) → Next
      expect(s1Row.cells.next.length).toBeGreaterThan(0);
      expect(s1Row.cells.next[0].id).toBe('A-5');
    });
  });

  describe('noDate_label_and_counts', () => {
    it('generates correct noDate summary with label and deeplink', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      const s1Row = result['S1'].grid.rows[0];
      
      expect(s1Row.cells.noDate.count).toBe(1);
      expect(s1Row.cells.noDate.points).toBe(5);
      expect(s1Row.cells.noDate.label).toBe('1 no due date (5 points)');
      expect(s1Row.cells.noDate.deepLinkUrl).toContain('student=S1');
      expect(s1Row.cells.noDate.deepLinkUrl).toContain('course=C-101');
    });
  });

  describe('summary_attention_counts_and_totalItems', () => {
    it('computes correct course-level attention counts', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      const s1Row = result['S1'].grid.rows[0];
      
      // Check counts match expected (excludes noDate from attentionCounts per spec)
      expect(s1Row.summary.attentionCounts.Check).toBe(0);
      expect(s1Row.summary.attentionCounts.Thumb).toBe(2); // A-2 (Tue, Due) + A-5 (Next, Due)
      expect(s1Row.summary.attentionCounts.Warning).toBe(2); // A-0 (Prior, Missing) + A-3 (Fri, Missing)
      expect(s1Row.summary.totalItems).toBe(4); // A-0, A-2, A-3, A-5 (excludes noDate)
    });

    it('computes correct student-level aggregated counts', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      const s1Summary = result['S1'].summary;
      
      expect(s1Summary.attentionCounts.Check).toBe(0);
      expect(s1Summary.attentionCounts.Thumb).toBe(2);
      expect(s1Summary.attentionCounts.Warning).toBe(2);
      expect(s1Summary.totalItems).toBe(4);
    });
  });

  describe('weekday_no_assignments_displays_empty', () => {
    it('includes empty arrays for weekdays with no assignments', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      const s1Row = result['S1'].grid.rows[0];
      
      // Mon, Wed, Thu should be empty
      expect(s1Row.cells.weekday.Mon).toEqual([]);
      expect(s1Row.cells.weekday.Wed).toEqual([]);
      expect(s1Row.cells.weekday.Thu).toEqual([]);
      
      // Prior, Next buckets must exist (may be empty)
      expect(s1Row.cells.prior).toBeDefined();
      expect(s1Row.cells.next).toBeDefined();
      expect(Array.isArray(s1Row.cells.prior)).toBe(true);
      expect(Array.isArray(s1Row.cells.next)).toBe(true);
    });
  });

  describe('indexed_lookup_is_direct', () => {
    it('supports direct lookup by studentId without iteration', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      // Direct O(1) lookup
      const selectedStudentId = 'S1';
      const studentGrid = result[selectedStudentId];
      
      expect(studentGrid).toBeDefined();
      expect(studentGrid.summary).toBeDefined();
      expect(studentGrid.grid).toBeDefined();
    });
  });

  describe('integration: two_students_small_fixture_matches', () => {
    it('matches complete expected output structure', () => {
      const result = getWeeklyGrids(
        twoStudentsSmall.studentData as any,
        twoStudentsSmall.asOf,
        twoStudentsSmall.timezone
      );
      
      // Verify header columns are exactly the 9 required
      expect(result['S1'].grid.header.columns.length).toBe(9);
      expect(result['S1'].grid.header.columns[0]).toBe('Class Name');
      expect(result['S1'].grid.header.columns[1]).toBe('Prior Weeks');
      expect(result['S1'].grid.header.columns[8]).toBe('No Date');
      
      // Verify Monday labels match week
      expect(result['S1'].grid.header.columns[2]).toContain('Mon (10/6)');
      expect(result['S1'].grid.header.columns[6]).toContain('Fri (10/10)');
      
      // Verify student IDs as keys
      expect(result['S1']).toBeDefined();
      expect(result['S2']).toBeDefined();
    });
  });
});
