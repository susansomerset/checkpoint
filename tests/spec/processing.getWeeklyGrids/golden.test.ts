/**
 * Golden output test for processing.getWeeklyGrids
 * 
 * This test asserts against a golden snapshot.
 * IMPORTANT: Golden files can only be updated with PO approval.
 */

import { getWeeklyGrids } from '../../../src/lib/compose/getWeeklyGrids';
import goldenOutput from './golden/two_students_small.json';
import fixtureInput from './fixtures/two_students_small.json';

describe('processing.getWeeklyGrids - Golden Output', () => {
  it('matches golden output for two_students_small', () => {
    const actual = getWeeklyGrids(
      fixtureInput.studentData as any,
      fixtureInput.asOf,
      fixtureInput.timezone
    );
    
    expect(actual).toEqual(goldenOutput);
  });
});

