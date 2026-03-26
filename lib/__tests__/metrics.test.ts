import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measurePerformance, measurePerformanceAsync } from '../metrics';
import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

describe('metrics helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('measurePerformance', () => {
    it('should execute function and measure duration', () => {
      const mockFn = vi.fn(() => 'result');

      const result = measurePerformance(mockFn, 'test_metric');

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledOnce();
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: 'test_metric',
          level: 'debug',
          data: expect.objectContaining({
            duration_ms: expect.any(Number),
          }),
        })
      );
    });

    it('should include custom tags in breadcrumb', () => {
      const mockFn = vi.fn(() => 42);

      measurePerformance(mockFn, 'custom_metric', { trade: 'Elevator', operation: 'create' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trade: 'Elevator',
            operation: 'create',
            duration_ms: expect.any(Number),
          }),
        })
      );
    });

    it('should handle errors and still track timing', () => {
      const mockFn = vi.fn(() => {
        throw new Error('Test error');
      });

      expect(() => measurePerformance(mockFn, 'error_metric')).toThrow('Test error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          data: expect.objectContaining({
            duration_ms: expect.any(Number),
            error: 'true',
          }),
        })
      );
    });
  });

  describe('measurePerformanceAsync', () => {
    it('should execute async function and measure duration', async () => {
      const mockFn = vi.fn(async () => 'async result');

      const result = await measurePerformanceAsync(mockFn, 'async_metric');

      expect(result).toBe('async result');
      expect(mockFn).toHaveBeenCalledOnce();
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: 'async_metric',
          level: 'debug',
          data: expect.objectContaining({
            duration_ms: expect.any(Number),
          }),
        })
      );
    });

    it('should handle async errors and still track timing', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Async error');
      });

      await expect(
        measurePerformanceAsync(mockFn, 'async_error_metric')
      ).rejects.toThrow('Async error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          data: expect.objectContaining({
            duration_ms: expect.any(Number),
            error: 'true',
          }),
        })
      );
    });

    it('should measure actual execution time', async () => {
      const mockFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'delayed result';
      });

      await measurePerformanceAsync(mockFn, 'timed_metric');

      const breadcrumbCall = vi.mocked(Sentry.addBreadcrumb).mock.calls[0][0];
      const duration = breadcrumbCall.data?.duration_ms as number;

      expect(duration).toBeGreaterThanOrEqual(45); // Allow small margin
    });
  });
});
