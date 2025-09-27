import {
  buildCanvasAssignmentUrl,
  buildCanvasCourseUrl,
  isValidCanvasUrl,
  extractCourseIdFromUrl,
  extractAssignmentIdFromUrl,
} from '@/lib/derive/canvasLinks'

describe('Canvas Link Helper', () => {
  describe('buildCanvasAssignmentUrl', () => {
    it('should build valid assignment URL with default base URL', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '12345',
        assignmentId: '67890',
      })

      expect(result).toBe('https://djusd.instructure.com/courses/12345/assignments/67890')
    })

    it('should build valid assignment URL with custom base URL', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '12345',
        assignmentId: '67890',
        baseUrl: 'https://custom.canvas.com',
      })

      expect(result).toBe('https://custom.canvas.com/courses/12345/assignments/67890')
    })

    it('should handle URL encoding for special characters', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '123 45',
        assignmentId: '678/90',
      })

      expect(result).toBe('https://djusd.instructure.com/courses/123%2045/assignments/678%2F90')
    })

    it('should return null for missing courseId', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '',
        assignmentId: '67890',
      })

      expect(result).toBeNull()
    })

    it('should return null for missing assignmentId', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '12345',
        assignmentId: '',
      })

      expect(result).toBeNull()
    })

    it('should return null for invalid courseId type', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: null as any,
        assignmentId: '67890',
      })

      expect(result).toBeNull()
    })

    it('should return null for invalid assignmentId type', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '12345',
        assignmentId: undefined as any,
      })

      expect(result).toBeNull()
    })

    it('should handle malformed base URL gracefully', () => {
      const result = buildCanvasAssignmentUrl({
        courseId: '12345',
        assignmentId: '67890',
        baseUrl: 'not-a-valid-url',
      })

      expect(result).toBeNull()
    })
  })

  describe('buildCanvasCourseUrl', () => {
    it('should build valid course URL with default base URL', () => {
      const result = buildCanvasCourseUrl('12345')

      expect(result).toBe('https://djusd.instructure.com/courses/12345')
    })

    it('should build valid course URL with custom base URL', () => {
      const result = buildCanvasCourseUrl('12345', 'https://custom.canvas.com')

      expect(result).toBe('https://custom.canvas.com/courses/12345')
    })

    it('should handle URL encoding for special characters', () => {
      const result = buildCanvasCourseUrl('123 45')

      expect(result).toBe('https://djusd.instructure.com/courses/123%2045')
    })

    it('should return null for empty courseId', () => {
      const result = buildCanvasCourseUrl('')

      expect(result).toBeNull()
    })

    it('should return null for invalid courseId type', () => {
      const result = buildCanvasCourseUrl(null as any)

      expect(result).toBeNull()
    })
  })

  describe('isValidCanvasUrl', () => {
    it('should return true for valid Canvas URL', () => {
      expect(isValidCanvasUrl('https://canvas.instructure.com/courses/12345')).toBe(true)
    })

    it('should return true for Canvas URL with subdomain', () => {
      expect(isValidCanvasUrl('https://school.instructure.com/courses/12345')).toBe(true)
    })

    it('should return true for instructure.com domain', () => {
      expect(isValidCanvasUrl('https://instructure.com/courses/12345')).toBe(true)
    })

    it('should return false for non-Canvas URL', () => {
      expect(isValidCanvasUrl('https://google.com')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(isValidCanvasUrl('not-a-url')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidCanvasUrl('')).toBe(false)
    })
  })

  describe('extractCourseIdFromUrl', () => {
    it('should extract course ID from valid URL', () => {
      const result = extractCourseIdFromUrl('https://canvas.instructure.com/courses/12345/assignments/67890')

      expect(result).toBe('12345')
    })

    it('should extract course ID from course-only URL', () => {
      const result = extractCourseIdFromUrl('https://canvas.instructure.com/courses/12345')

      expect(result).toBe('12345')
    })

    it('should return null for URL without course ID', () => {
      const result = extractCourseIdFromUrl('https://canvas.instructure.com/')

      expect(result).toBeNull()
    })

    it('should return null for invalid URL', () => {
      const result = extractCourseIdFromUrl('not-a-url')

      expect(result).toBeNull()
    })
  })

  describe('extractAssignmentIdFromUrl', () => {
    it('should extract assignment ID from valid URL', () => {
      const result = extractAssignmentIdFromUrl('https://canvas.instructure.com/courses/12345/assignments/67890')

      expect(result).toBe('67890')
    })

    it('should return null for URL without assignment ID', () => {
      const result = extractAssignmentIdFromUrl('https://canvas.instructure.com/courses/12345')

      expect(result).toBeNull()
    })

    it('should return null for invalid URL', () => {
      const result = extractAssignmentIdFromUrl('not-a-url')

      expect(result).toBeNull()
    })
  })

  describe('Error handling and logging', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log warning for missing courseId', () => {
      buildCanvasAssignmentUrl({
        courseId: '',
        assignmentId: '67890',
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Canvas link builder: Missing required courseId or assignmentId',
        { courseId: '', assignmentId: '67890' }
      )
    })

    it('should log warning for invalid courseId format', () => {
      buildCanvasAssignmentUrl({
        courseId: null as any,
        assignmentId: '67890',
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Canvas link builder: Missing required courseId or assignmentId',
        { courseId: null, assignmentId: '67890' }
      )
    })
  })
})
