// selectors/__tests__/radial.test.ts
// Unit tests for radial selector functions

import { radialVMFromBuckets } from '../radial';

describe('radialVMFromBuckets', () => {
  it('center % = (total - Missing)/total', () => {
    const vm = radialVMFromBuckets({ Earned: 30, Submitted: 40, Missing: 10, Lost: 20 }); // total 100
    expect(vm.centerPercent).toBe(90);
  });

  it('normalizes segments to a contiguous ring', () => {
    const vm = radialVMFromBuckets({ Earned: 50, Submitted: 50, Missing: 0, Lost: 0 });
    const sum = Math.round(vm.segments.reduce((a, s) => a + s.percentage, 0));
    expect(sum).toBe(100);
  });

  it('handles zero total gracefully', () => {
    const vm = radialVMFromBuckets({ Earned: 0, Submitted: 0, Missing: 0, Lost: 0 });
    expect(vm.centerPercent).toBe(0);
    expect(vm.segments.every(s => s.percentage === 0)).toBe(true);
  });

  it('clamps center percent to 0-100 range', () => {
    const vm = radialVMFromBuckets({ Earned: 0, Submitted: 0, Missing: 100, Lost: 0 });
    expect(vm.centerPercent).toBe(0);
  });
});
