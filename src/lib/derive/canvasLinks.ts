/**
 * Centralized Canvas link generation to avoid URL mismatches
 */

/**
 * Generate Canvas assignment link
 */
export const linkToAssignment = (courseId: string, assignmentId: string): string => {
  // Extract the base URL from environment or use default
  const baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com'
  
  // Remove trailing slash from base URL
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  return `${cleanBaseUrl}/courses/${courseId}/assignments/${assignmentId}`
}

/**
 * Generate Canvas course link
 */
export const linkToCourse = (courseId: string): string => {
  const baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com'
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  return `${cleanBaseUrl}/courses/${courseId}`
}

/**
 * Generate Canvas submission link
 */
export const linkToSubmission = (courseId: string, assignmentId: string, submissionId: string): string => {
  const baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com'
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  return `${cleanBaseUrl}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`
}

/**
 * Generate Canvas user profile link
 */
export const linkToUser = (userId: string): string => {
  const baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com'
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  return `${cleanBaseUrl}/users/${userId}`
}

/**
 * Validate Canvas URL format
 */
export const isValidCanvasUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:' && 
           (parsedUrl.hostname.includes('canvas.instructure.com') || 
            parsedUrl.hostname.includes('canvas.'))
  } catch {
    return false
  }
}

/**
 * Extract course ID from Canvas URL
 */
export const extractCourseIdFromUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    const pathParts = parsedUrl.pathname.split('/')
    const coursesIndex = pathParts.indexOf('courses')
    
    if (coursesIndex !== -1 && pathParts[coursesIndex + 1]) {
      return pathParts[coursesIndex + 1]
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Extract assignment ID from Canvas URL
 */
export const extractAssignmentIdFromUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    const pathParts = parsedUrl.pathname.split('/')
    const assignmentsIndex = pathParts.indexOf('assignments')
    
    if (assignmentsIndex !== -1 && pathParts[assignmentsIndex + 1]) {
      return pathParts[assignmentsIndex + 1]
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Generate link with proper security attributes
 */
export const generateSecureLink = (url: string, text: string): string => {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
}

/**
 * Get Canvas base URL from environment
 */
export const getCanvasBaseUrl = (): string => {
  return process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com'
}
