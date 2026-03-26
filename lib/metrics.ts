import * as Sentry from "@sentry/nextjs";

/**
 * Centralized metrics tracking system
 * Tracks business metrics, performance metrics, and user engagement
 *
 * Uses Sentry breadcrumbs and custom contexts for tracking.
 * For more advanced metrics, consider upgrading to Sentry Performance Monitoring.
 */

// Business Metrics
export const BusinessMetrics = {
  /**
   * Track job creation with trade and role context
   */
  trackJobCreation(trade: string, role: string, duration: number) {
    Sentry.addBreadcrumb({
      category: "business",
      message: "Job created",
      level: "info",
      data: { trade, role, duration_ms: duration },
    });

    // Track as custom measurement
    if (typeof window !== "undefined") {
      console.log(`[Metrics] Job created: ${trade}/${role} in ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track document uploads by file type
   */
  trackDocumentUpload(fileType: string, fileSize: number, duration: number) {
    Sentry.addBreadcrumb({
      category: "business",
      message: "Document uploaded",
      level: "info",
      data: { file_type: fileType, size_bytes: fileSize, duration_ms: duration },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Document uploaded: ${fileType}, ${fileSize} bytes, ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track document deletions
   */
  trackDocumentDeletion(fileType: string, duration: number) {
    Sentry.addBreadcrumb({
      category: "business",
      message: "Document deleted",
      level: "info",
      data: { file_type: fileType, duration_ms: duration },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Document deleted: ${fileType} in ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track AI folder parsing performance
   */
  trackAIParsing(fileCount: number, duration: number, jobsFound: number, success: boolean) {
    Sentry.addBreadcrumb({
      category: "business",
      message: "AI folder parsing completed",
      level: success ? "info" : "warning",
      data: {
        file_count: fileCount,
        duration_ms: duration,
        jobs_found: jobsFound,
        success
      },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] AI Parse: ${fileCount} files → ${jobsFound} jobs in ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track job stage transitions
   */
  trackStageChange(fromStage: string, toStage: string, trade: string) {
    Sentry.addBreadcrumb({
      category: "business",
      message: "Job stage changed",
      level: "info",
      data: { from_stage: fromStage, to_stage: toStage, trade },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Stage change: ${fromStage} → ${toStage} (${trade})`);
    }
  },
};

// Performance Metrics
export const PerformanceMetrics = {
  /**
   * Track API endpoint latency
   */
  trackAPILatency(endpoint: string, method: string, duration: number, statusCode: number) {
    Sentry.addBreadcrumb({
      category: "performance",
      message: `API ${method} ${endpoint}`,
      level: statusCode >= 400 ? "error" : "info",
      data: { endpoint, method, duration_ms: duration, status: statusCode },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] API ${method} ${endpoint}: ${statusCode} in ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track database query performance
   */
  trackDatabaseQuery(table: string, operation: string, duration: number) {
    Sentry.addBreadcrumb({
      category: "performance",
      message: `DB ${operation} on ${table}`,
      level: "info",
      data: { table, operation, duration_ms: duration },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] DB ${operation} ${table}: ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Track cache hit/miss
   */
  trackCacheOperation(cacheKey: string, hit: boolean) {
    Sentry.addBreadcrumb({
      category: "performance",
      message: `Cache ${hit ? "hit" : "miss"}`,
      level: "debug",
      data: { cache_key: cacheKey, hit },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Cache ${hit ? "HIT" : "MISS"}: ${cacheKey}`);
    }
  },
};

// User Engagement Metrics
export const EngagementMetrics = {
  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, trade?: string) {
    Sentry.addBreadcrumb({
      category: "engagement",
      message: `Feature used: ${feature}`,
      level: "info",
      data: { feature, trade: trade || "unknown" },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Feature used: ${feature} (${trade || "unknown"})`);
    }
  },

  /**
   * Track navigation events
   */
  trackNavigation(fromPage: string, toPage: string, hasWarning: boolean) {
    Sentry.addBreadcrumb({
      category: "engagement",
      message: "Page navigation",
      level: hasWarning ? "warning" : "info",
      data: { from: fromPage, to: toPage, warning: hasWarning },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Navigation: ${fromPage} → ${toPage} ${hasWarning ? "(with warning)" : ""}`);
    }
  },

  /**
   * Track drag-and-drop usage
   */
  trackDragDrop(context: string) {
    Sentry.addBreadcrumb({
      category: "engagement",
      message: "Drag and drop interaction",
      level: "info",
      data: { context },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] Drag & Drop: ${context}`);
    }
  },
};

// Error Metrics
export const ErrorMetrics = {
  /**
   * Track custom error events with context
   */
  trackError(errorType: string, errorMessage: string, context?: Record<string, unknown>) {
    Sentry.captureException(new Error(errorMessage), {
      tags: { error_type: errorType },
      contexts: { custom: context },
    });

    if (typeof window !== "undefined") {
      console.error(`[Metrics] Error: ${errorType} - ${errorMessage}`, context);
    }
  },

  /**
   * Track validation failures
   */
  trackValidationError(field: string, reason: string) {
    Sentry.addBreadcrumb({
      category: "validation",
      message: "Validation failed",
      level: "warning",
      data: { field, reason },
    });

    if (typeof window !== "undefined") {
      console.warn(`[Metrics] Validation failed: ${field} - ${reason}`);
    }
  },
};

// Helper to measure function execution time
export function measurePerformance<T>(
  fn: () => T,
  metricName: string,
  tags?: Record<string, string>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;

    Sentry.addBreadcrumb({
      category: "performance",
      message: metricName,
      level: "debug",
      data: { ...tags, duration_ms: duration },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] ${metricName}: ${duration.toFixed(2)}ms`, tags);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    Sentry.addBreadcrumb({
      category: "performance",
      message: metricName,
      level: "error",
      data: { ...tags, duration_ms: duration, error: "true" },
    });
    throw error;
  }
}

// Helper for async functions
export async function measurePerformanceAsync<T>(
  fn: () => Promise<T>,
  metricName: string,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    Sentry.addBreadcrumb({
      category: "performance",
      message: metricName,
      level: "debug",
      data: { ...tags, duration_ms: duration },
    });

    if (typeof window !== "undefined") {
      console.log(`[Metrics] ${metricName}: ${duration.toFixed(2)}ms`, tags);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    Sentry.addBreadcrumb({
      category: "performance",
      message: metricName,
      level: "error",
      data: { ...tags, duration_ms: duration, error: "true" },
    });
    throw error;
  }
}

// Export all metrics under one namespace
export const Metrics = {
  business: BusinessMetrics,
  performance: PerformanceMetrics,
  engagement: EngagementMetrics,
  error: ErrorMetrics,
  measure: measurePerformance,
  measureAsync: measurePerformanceAsync,
};
