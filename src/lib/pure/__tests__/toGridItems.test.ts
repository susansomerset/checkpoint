/**
 * Unit tests for processing.toGridItems v1.1.0
 * Spec: spec/current.json
 */

import { toGridItems, GridItemEntry, FormatType } from '../toGridItems';
import weekdayBatch from '../../../../tests/fixtures/processing.toGridItems/weekday_batch.json';
import priorBatch from '../../../../tests/fixtures/processing.toGridItems/prior_batch.json';
import nextBatch from '../../../../tests/fixtures/processing.toGridItems/next_batch.json';

describe('processing.toGridItems', () => {
  describe('maps_array_length_and_order', () => {
    it('preserves input array length', () => {
      const result = toGridItems(
        weekdayBatch.entries as unknown as GridItemEntry[],
        weekdayBatch.formatType as FormatType,
        weekdayBatch.asOf,
        weekdayBatch.timezone
      );
      
      expect(result.length).toBe(weekdayBatch.entries.length);
      expect(result.length).toBe(6);
    });

    it('preserves input order by id', () => {
      const result = toGridItems(
        weekdayBatch.entries as unknown as GridItemEntry[],
        weekdayBatch.formatType as FormatType,
        weekdayBatch.asOf,
        weekdayBatch.timezone
      );
      
      expect(result[0].id).toBe('A-100');
      expect(result[1].id).toBe('A-101');
      expect(result[2].id).toBe('A-102');
      expect(result[3].id).toBe('A-103');
      expect(result[4].id).toBe('A-104');
      expect(result[5].id).toBe('A-105');
    });
  });

  describe('mix_of_statuses_attention_types', () => {
    it('assigns correct attention types for all statuses', () => {
      const result = toGridItems(
        weekdayBatch.entries as unknown as GridItemEntry[],
        weekdayBatch.formatType as FormatType,
        weekdayBatch.asOf,
        weekdayBatch.timezone
      );
      
      // A-100: Due → Thumb
      expect(result[0].attentionType).toBe('Thumb');
      
      // A-101: Submitted → Check
      expect(result[1].attentionType).toBe('Check');
      
      // A-102: Graded → Check
      expect(result[2].attentionType).toBe('Check');
      
      // A-103, A-104, A-105: Missing → Question or Warning (depends on previous day logic)
      expect(['Question', 'Warning']).toContain(result[3].attentionType);
      expect(['Question', 'Warning']).toContain(result[4].attentionType);
      expect(['Question', 'Warning']).toContain(result[5].attentionType);
    });
  });

  describe('title_formats_all_three_modes', () => {
    it('formats Weekday titles without date prefix', () => {
      const result = toGridItems(
        weekdayBatch.entries as unknown as GridItemEntry[],
        weekdayBatch.formatType as FormatType,
        weekdayBatch.asOf,
        weekdayBatch.timezone
      );
      
      // Weekday format: Name (pts)
      expect(result[0].title).toBe('Weekly Reflection #3 (25)');
      expect(result[1].title).toBe('Lab 2: Vectors (10)');
    });

    it('formats Prior titles with M/d prefix', () => {
      const result = toGridItems(
        priorBatch.entries as unknown as GridItemEntry[],
        priorBatch.formatType as FormatType,
        priorBatch.asOf,
        priorBatch.timezone
      );
      
      // Prior format: M/d: Name (pts)
      expect(result[0].title).toMatch(/^\d{1,2}\/\d{1,2}:/);
      expect(result[0].title).toBe('10/3: Quiz 1 (5)');
    });

    it('formats Next titles with EEE prefix', () => {
      const result = toGridItems(
        nextBatch.entries as unknown as GridItemEntry[],
        nextBatch.formatType as FormatType,
        nextBatch.asOf,
        nextBatch.timezone
      );
      
      // Next format: EEE: Name (pts)
      expect(result[0].title).toMatch(/^[A-Z][a-z]{2}:/);
      expect(result[0].title).toBe('Wed: Problem Set (20)');
    });
  });

  describe('weekday_matches_dueAt', () => {
    it('EEE prefix matches actual weekday of dueAt in timezone', () => {
      const result = toGridItems(
        nextBatch.entries as unknown as GridItemEntry[],
        nextBatch.formatType as FormatType,
        nextBatch.asOf,
        nextBatch.timezone
      );
      
      // A-105 due_at is 2025-10-01 which is a Wednesday
      expect(result[0].title).toMatch(/^Wed:/);
    });
  });

  describe('url_mapping_trivial', () => {
    it('maps html_url to GridItem.url', () => {
      const result = toGridItems(
        weekdayBatch.entries as unknown as GridItemEntry[],
        weekdayBatch.formatType as FormatType,
        weekdayBatch.asOf,
        weekdayBatch.timezone
      );
      
      expect(result[0].url).toBe('https://canvas.example/courses/42/assignments/100');
      expect(result[1].url).toBe('https://canvas.example/courses/42/assignments/101');
    });
  });

  describe('validation', () => {
    it('throws error when id is empty', () => {
      const invalidEntries: GridItemEntry[] = [{
        // eslint-disable-next-line camelcase
        assignment: { id: '', name: 'Test', html_url: 'https://example.com' },
        checkpointStatus: 'Due'
      }];
      
      expect(() => {
        toGridItems(invalidEntries, 'Weekday', '2025-10-01T12:00:00Z');
      }).toThrow('Assignment ID is required and cannot be empty');
    });

    it('throws error when url is missing', () => {
      const invalidEntries: GridItemEntry[] = [{
        assignment: { id: 'A-100', name: 'Test' },
        checkpointStatus: 'Due'
      }];
      
      expect(() => {
        toGridItems(invalidEntries, 'Weekday', '2025-10-01T12:00:00Z');
      }).toThrow('URL is required');
    });

    it('throws error when url does not start with http(s)', () => {
      const invalidEntries: GridItemEntry[] = [{
        // eslint-disable-next-line camelcase
        assignment: { id: 'A-100', name: 'Test', html_url: 'ftp://example.com' },
        checkpointStatus: 'Due'
      }];
      
      expect(() => {
        toGridItems(invalidEntries, 'Weekday', '2025-10-01T12:00:00Z');
      }).toThrow('URL must start with http:// or https://');
    });
  });
});
