/**
 * Unit tests for processing.getWeeklyGrids
 * Uses spec fixtures from spec/current.json via specRunner
 */

import { runFixture } from '../_utils/specRunner';
import { getWeeklyGrids } from '../../../src/lib/compose/getWeeklyGrids';

describe('processing.getWeeklyGrids', () => {
  it.skip('two_students_small matches spec (TODO: update fixture to real StudentData structure)', async () => {
    await runFixture({
      nodeId: 'processing.getWeeklyGrids',
      caseName: 'two_students_small',
      impl: (input) => getWeeklyGrids(input.studentData, input.asOf, input.timezone)
    });
  });
});

