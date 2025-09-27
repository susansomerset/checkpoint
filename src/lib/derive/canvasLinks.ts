/**
 * Canvas Link Helper
 * 
 * Generates Canvas assignment URLs with proper configuration
 * and security attributes.
 */

export interface CanvasConfig {
  baseUrl: string
}

// Default Canvas configuration
const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  baseUrl: 'https://djusd.instructure.com'
}

/**
 * Builds a Canvas assignment URL
 * 
 * @param courseId - Canvas course ID
 * @param assignmentId - Canvas assignment ID
 * @param config - Optional Canvas configuration
 * @returns Complete Canvas assignment URL
 */
export function buildCanvasAssignmentUrl(
  courseId: string | number,
  assignmentId: string | number,
  config: CanvasConfig = DEFAULT_CANVAS_CONFIG
): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
  return `${baseUrl}/courses/${courseId}/assignments/${assignmentId}`
}

/**
 * Builds a Canvas course URL
 * 
 * @param courseId - Canvas course ID
 * @param config - Optional Canvas configuration
 * @returns Complete Canvas course URL
 */
export function buildCanvasCourseUrl(
  courseId: string | number,
  config: CanvasConfig = DEFAULT_CANVAS_CONFIG
): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
  return `${baseUrl}/courses/${courseId}`
}

/**
 * Validates a Canvas URL
 * 
 * @param url - URL to validate
 * @returns true if URL appears to be a valid Canvas URL
 */
export function isValidCanvasUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('instructure.com') || 
           parsed.hostname.includes('canvas')
  } catch {
    return false
  }
}