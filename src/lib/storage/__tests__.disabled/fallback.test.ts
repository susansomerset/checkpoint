/**
 * Tests for fallback functionality
 */

import { getWithFallback, setWithDualWrite, getMetrics, resetMetrics } from '../fallback';
// import { getRaw, setRaw } from '../redis-raw';
// import { k } from '../prefix';

// Mock the redis-raw module
jest.mock('../redis-raw', () => ({
  getRaw: jest.fn(),
  setRaw: jest.fn(),
}));

// Mock the kv module
jest.mock('../kv', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// const mockGetRaw = getRaw as jest.MockedFunction<typeof getRaw>;
// const mockSetRaw = setRaw as jest.MockedFunction<typeof setRaw>;

describe('fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMetrics();
    delete process.env.USE_KV_FALLBACK;
    delete process.env.DUAL_WRITE;
  });

  describe('getWithFallback', () => {
    it('returns value from Upstash when available', async () => {
      const { getRaw: mockGetRaw } = jest.requireMock('../redis-raw');
      mockGetRaw.mockResolvedValue('test-value');
      
      const result = await getWithFallback('test-key');
      
      expect(result).toBe('test-value');
      expect(mockGetRaw).toHaveBeenCalledWith('test-key');
    });

    it('returns null when Upstash has no value and fallback disabled', async () => {
      const { getRaw: mockGetRaw } = jest.requireMock('../redis-raw');
      mockGetRaw.mockResolvedValue(null);
      
      const result = await getWithFallback('test-key');
      
      expect(result).toBe(null);
    });

    it('falls back to legacy KV when enabled and Upstash miss', async () => {
      process.env.USE_KV_FALLBACK = '1';
      const { getRaw: mockGetRaw, setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockGetRaw.mockResolvedValue(null);
      
      const { get: mockLegacyGet } = jest.requireMock('../kv');
      const { set: mockLegacySet } = jest.requireMock('../kv');
      mockLegacyGet.mockResolvedValue('legacy-value');
      mockSetRaw.mockResolvedValue();
      
      const result = await getWithFallback('test-key');
      
      expect(result).toBe('legacy-value');
      expect(mockSetRaw).toHaveBeenCalledWith('test-key', 'legacy-value');
      
      const metrics = getMetrics();
      expect(metrics.kvFallbackHits).toBe(1);
    });
  });

  describe('setWithDualWrite', () => {
    it('writes to Upstash only when dual-write disabled', async () => {
      const { setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockSetRaw.mockResolvedValue();
      
      await setWithDualWrite('test-key', 'test-value');
      
      expect(mockSetRaw).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('writes to both stores when dual-write enabled', async () => {
      process.env.DUAL_WRITE = '1';
      const { setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockSetRaw.mockResolvedValue();
      
      const { set: mockLegacySet } = jest.requireMock('../kv');
      mockLegacySet.mockResolvedValue();
      
      await setWithDualWrite('test-key', 'test-value');
      
      expect(mockSetRaw).toHaveBeenCalledWith('test-key', 'test-value');
      expect(mockLegacySet).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('handles dual-write errors gracefully', async () => {
      process.env.DUAL_WRITE = '1';
      const { setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockSetRaw.mockResolvedValue();
      
      const { set: mockLegacySet } = jest.requireMock('../kv');
      mockLegacySet.mockRejectedValue(new Error('Legacy write failed'));
      
      await setWithDualWrite('test-key', 'test-value');
      
      expect(mockSetRaw).toHaveBeenCalledWith('test-key', 'test-value');
      expect(mockLegacySet).toHaveBeenCalledWith('test-key', 'test-value');
      
      const metrics = getMetrics();
      expect(metrics.dualWriteErrors).toBe(1);
    });
  });

  describe('metrics', () => {
    it('tracks fallback hits', async () => {
      process.env.USE_KV_FALLBACK = '1';
      const { getRaw: mockGetRaw, setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockGetRaw.mockResolvedValue(null);
      
      const { get: mockLegacyGet } = jest.requireMock('../kv');
      mockLegacyGet.mockResolvedValue('legacy-value');
      mockSetRaw.mockResolvedValue();
      
      await getWithFallback('test-key');
      await getWithFallback('test-key2');
      
      const metrics = getMetrics();
      expect(metrics.kvFallbackHits).toBe(2);
    });

    it('tracks dual-write errors', async () => {
      process.env.DUAL_WRITE = '1';
      const { setRaw: mockSetRaw } = jest.requireMock('../redis-raw');
      mockSetRaw.mockResolvedValue();
      
      const { set: mockLegacySet } = jest.requireMock('../kv');
      mockLegacySet.mockRejectedValue(new Error('Legacy write failed'));
      
      await setWithDualWrite('test-key', 'test-value');
      await setWithDualWrite('test-key2', 'test-value2');
      
      const metrics = getMetrics();
      expect(metrics.dualWriteErrors).toBe(2);
    });
  });
});

