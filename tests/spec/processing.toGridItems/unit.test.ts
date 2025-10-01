/**
 * Unit tests for processing.toGridItems
 * Uses spec fixtures from spec/current.json via specRunner
 */

import { runFixture } from '../_utils/specRunner';
import { toGridItems } from '../../../src/lib/pure/toGridItems';

describe('processing.toGridItems', () => {
  it('weekday_batch matches spec', async () => {
    await runFixture({
      nodeId: 'processing.toGridItems',
      caseName: 'weekday_batch',
      impl: (input) => toGridItems(input.entries, input.formatType, input.asOf, input.timezone)
    });
  });

  it('prior_batch matches spec', async () => {
    await runFixture({
      nodeId: 'processing.toGridItems',
      caseName: 'prior_batch',
      impl: (input) => toGridItems(input.entries, input.formatType, input.asOf, input.timezone)
    });
  });

  it('next_batch matches spec', async () => {
    await runFixture({
      nodeId: 'processing.toGridItems',
      caseName: 'next_batch',
      impl: (input) => toGridItems(input.entries, input.formatType, input.asOf, input.timezone)
    });
  });
});

