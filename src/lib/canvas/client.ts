/**
 * Canvas API Client - Lowest Layer
 * 
 * Single responsibility: fetch and paginate Canvas API calls with rate limiting
 * 
 * Features:
 * - Automatic retry with exponential backoff for 429/5xx errors
 * - Rate limiting protection (max 5 concurrent requests)
 * - Comprehensive error handling with URL context
 * - Pagination support for large datasets
 * 
 * Usage:
 * - All Canvas API calls should go through this client
 * - Never make direct fetch() calls to Canvas API
 * - Use createCanvasClient() factory function
 */

export interface CanvasConfig {
  baseUrl: string;
  accessToken: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class CanvasClient {
  private config: CanvasConfig;
  private retryConfig: RetryConfig;
  private activeRequests: number = 0;
  private maxConcurrentRequests: number = 5;

  constructor(config: CanvasConfig) {
    this.config = config;
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2
    };
  }

  /**
   * Fetch a single Canvas API endpoint with retry logic and rate limiting
   * 
   * @param path - API path (e.g., '/api/v1/courses/123/assignments')
   * @param query - Query parameters as key-value pairs
   * @returns Promise resolving to JSON response
   * @throws Error with detailed context on failure
   */
  async canvasFetch(path: string, query?: Record<string, string | string[]>): Promise<any> {
    // Wait for available slot if at concurrency limit
    await this.waitForAvailableSlot();
    
    const baseUrl = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(fullPath, baseUrl);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.set(key, value);
        }
      });
    }

    return this.fetchWithRetry(url.toString());
  }

  /**
   * Fetch with retry logic for rate limiting and server errors
   */
  private async fetchWithRetry(url: string, attempt: number = 1): Promise<any> {
    const response = await this.fetchWithRetryAndHeaders(url, attempt);
    return response.data;
  }

  /**
   * Fetch with retry logic, returning both data and headers for pagination
   */
  private async fetchWithRetryAndHeaders(url: string, attempt: number = 1): Promise<{ data: any; headers: Headers }> {
    try {
      this.activeRequests++;
      
      const response = await fetch(url, {
    headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-store'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { data, headers: response.headers };
      }

      // Handle retryable errors
      if (this.shouldRetry(response.status, attempt)) {
        const delay = this.calculateDelay(attempt);
        console.log(`ZXQ Canvas API retry ${attempt}/${this.retryConfig.maxRetries} for ${response.status} - waiting ${delay}ms - URL: ${url}`);
        await this.sleep(delay);
        return this.fetchWithRetryAndHeaders(url, attempt + 1);
      }

      // Non-retryable error
      throw new Error(`Canvas API request failed: ${response.status} ${response.statusText} - URL: ${url}`);
      
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Determine if a request should be retried based on status code and attempt count
   */
  private shouldRetry(status: number, attempt: number): boolean {
    if (attempt > this.retryConfig.maxRetries) {
      return false;
    }
    
    // Retry on rate limiting (429) and server errors (5xx)
    return status === 429 || (status >= 500 && status < 600);
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);
    
    // Add jitter (±25%) to prevent thundering herd
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);
    return Math.max(100, Math.floor(cappedDelay + jitter));
  }

  /**
   * Wait for available concurrency slot
   */
  private async waitForAvailableSlot(): Promise<void> {
    while (this.activeRequests >= this.maxConcurrentRequests) {
      await this.sleep(50); // Check every 50ms
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch all pages of a Canvas API endpoint with automatic pagination
   * 
   * Handles Canvas Link header pagination automatically, fetching all pages
   * until no more 'next' links are found. Includes rate limiting and retry logic.
   * 
   * @param path - API path (e.g., '/api/v1/courses/123/assignments')
   * @param query - Query parameters as key-value pairs
   * @returns Promise resolving to array of all paginated data
   * @throws Error with detailed context on failure
   */
  async paginate<T>(path: string, query?: Record<string, string | string[]>): Promise<T[]> {
    let allData: T[] = [];
    let nextUrl: string | null = null;

    // Build initial URL
    const baseUrl = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const initialUrl = new URL(fullPath, baseUrl);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => initialUrl.searchParams.append(key, v));
        } else {
          initialUrl.searchParams.set(key, value);
        }
      });
    }
    
    nextUrl = initialUrl.toString();

    while (nextUrl) {
      // Wait for available slot if at concurrency limit
      await this.waitForAvailableSlot();
      
      // Fetch page data with retry logic
      const response = await this.fetchWithRetryAndHeaders(nextUrl);
      allData = allData.concat(response.data);

      // Parse Link header for next page URL
      const linkHeader = response.headers.get('Link');
      nextUrl = this.parseLinkHeader(linkHeader);
    }

    return allData;
  }

  /**
   * Paginate a custom URL (for special cases like submissions with literal brackets)
   * 
   * Used when the standard paginate() method can't handle special URL construction
   * requirements, such as Canvas submissions endpoint with student_ids[] parameter.
   * 
   * @param url - Full URL to paginate (must include all query parameters)
   * @returns Promise resolving to array of all paginated data
   */
  async paginateCustomUrl<T>(url: string): Promise<T[]> {
    let allData: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      // Wait for available slot if at concurrency limit
      await this.waitForAvailableSlot();
      
      // Fetch page data with retry logic
      const response = await this.fetchWithRetryAndHeaders(nextUrl);
      allData = allData.concat(response.data);

      // Parse Link header for next page URL
      const linkHeader = response.headers.get('Link');
      nextUrl = this.parseLinkHeader(linkHeader);
    }

    return allData;
  }

  /**
   * Parse Canvas Link header to find next page URL
   * 
   * Canvas uses Link headers for pagination: <url>; rel="next"
   * This method extracts the 'next' URL from the Link header.
   * 
   * @param linkHeader - Raw Link header string from Canvas API
   * @returns Next page URL or null if no more pages
   */
  private parseLinkHeader(linkHeader: string | null): string | null {
    if (!linkHeader) {
      return null;
    }

    const links = linkHeader.split(',').map(link => link.trim());
    for (const link of links) {
      const parts = link.split(';');
      const url = parts[0].replace(/<|>/g, '');
      const rel = parts[1].replace(/rel="|"/g, '').trim();
      if (rel === 'next') {
        return url;
      }
    }
    return null;
  }
}

/**
 * Factory function to create Canvas client with environment configuration
 * 
 * Reads Canvas API configuration from environment variables.
 * Called at runtime, not import time, to avoid module-level errors.
 * 
 * Required environment variables:
 * - CANVAS_BASE_URL: Canvas instance base URL (e.g., 'https://school.instructure.com')
 * - CANVAS_ACCESS_TOKEN or CANVAS_TOKEN: Canvas API access token
 * 
 * @returns Configured CanvasClient instance
 * @throws Error if required environment variables are missing
 */
export function createCanvasClient(): CanvasClient {
  const canvasBaseUrl = process.env.CANVAS_BASE_URL;
  const canvasAccessToken = process.env.CANVAS_ACCESS_TOKEN || process.env.CANVAS_TOKEN;

  if (!canvasBaseUrl || !canvasAccessToken) {
    throw new Error('Canvas configuration missing - check CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN environment variables');
  }

  return new CanvasClient({
    baseUrl: canvasBaseUrl,
    accessToken: canvasAccessToken
  });
}