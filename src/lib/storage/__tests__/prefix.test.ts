/**
 * Tests for prefix.ts - ensure production safety
 */

// import { k } from '../prefix';

describe('prefix.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('k() function', () => {
    it('should use namespace when UPSTASH_NAMESPACE is set', () => {
      process.env.UPSTASH_NAMESPACE = 'test:ns';
      const { k } = require('../prefix');
      
      expect(k('studentData:v1')).toBe('test:ns:studentData:v1');
    });

    it('should throw in production when UPSTASH_NAMESPACE is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.UPSTASH_NAMESPACE;
      const { k } = require('../prefix');
      
      expect(() => k('studentData:v1')).toThrow('UPSTASH_NAMESPACE is required in production');
    });

    it('should throw in production when UPSTASH_NAMESPACE is empty', () => {
      process.env.NODE_ENV = 'production';
      process.env.UPSTASH_NAMESPACE = '   ';
      const { k } = require('../prefix');
      
      expect(() => k('studentData:v1')).toThrow('UPSTASH_NAMESPACE is required in production');
    });

    it('should use fallback in development when UPSTASH_NAMESPACE is missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.UPSTASH_NAMESPACE;
      const { k } = require('../prefix');
      
      expect(k('studentData:v1')).toBe('dev:studentData:v1');
    });

    it('should use fallback in test when UPSTASH_NAMESPACE is missing', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.UPSTASH_NAMESPACE;
      const { k } = require('../prefix');
      
      expect(k('studentData:v1')).toBe('dev:studentData:v1');
    });

    it('should suppress warnings when LOG_NS_WARN=0', () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_NS_WARN = '0';
      delete process.env.UPSTASH_NAMESPACE;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { k } = require('../prefix');
      
      k('studentData:v1');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});