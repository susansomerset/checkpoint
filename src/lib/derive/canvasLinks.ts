/**
 * Centralized Canvas link builder
 * Prevents death-by-typo in Canvas URLs across all components
 */

export interface CanvasLinkOptions {
  courseId: string
  assignmentId?: string
  baseUrl?: string
}

/**
 * Generate Canvas assignment URL
 * @param options - Canvas link options
 * @returns Complete Canvas URL or null if invalid
 */
export function buildCanvasAssignmentUrl(options: CanvasLinkOptions): string | null {
  const { courseId, assignmentId, baseUrl = 'https://djusd.instructure.com' } = options

  // Validate required parameters
  if (!courseId || !assignmentId) {
    console.warn('Canvas link builder: Missing required courseId or assignmentId', { courseId, assignmentId })
    return null
  }

  // Validate ID format (basic check for non-empty strings)
  if (typeof courseId !== 'string' || courseId.trim() === '') {
    console.warn('Canvas link builder: Invalid courseId format', { courseId })
    return null
  }

  if (typeof assignmentId !== 'string' || assignmentId.trim() === '') {
    console.warn('Canvas link builder: Invalid assignmentId format', { assignmentId })
    return null
  }

  try {
    // Build Canvas assignment URL
    const url = `${baseUrl}/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`
    
    // Validate the constructed URL
    new URL(url)
    return url
  } catch (error) {
    console.error('Canvas link builder: Failed to construct URL', { 
      courseId, 
      assignmentId, 
      baseUrl, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return null
  }
}

/**
 * Generate Canvas course URL
 * @param courseId - Canvas course ID
 * @param baseUrl - Canvas base URL (optional)
 * @returns Complete Canvas course URL or null if invalid
 */
export function buildCanvasCourseUrl(courseId: string, baseUrl: string = 'https://djusd.instructure.com'): string | null {
  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    console.warn('Canvas link builder: Invalid courseId for course URL', { courseId })
    return null
  }

  try {
    const url = `${baseUrl}/courses/${encodeURIComponent(courseId)}`
    new URL(url)
    return url
  } catch (error) {
    console.error('Canvas link builder: Failed to construct course URL', { 
      courseId, 
      baseUrl, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return null
  }
}

/**
 * Validate Canvas URL format
 * @param url - URL to validate
 * @returns true if valid Canvas URL format
 */
export function isValidCanvasUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('canvas.instructure.com') || 
           parsed.hostname.includes('instructure.com')
  } catch {
    return false
  }
}

/**
 * Extract course ID from Canvas URL
 * @param url - Canvas URL
 * @returns Course ID or null if not found
 */
export function extractCourseIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/courses\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Extract assignment ID from Canvas URL
 * @param url - Canvas URL
 * @returns Assignment ID or null if not found
 */
export function extractAssignmentIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/assignments\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}