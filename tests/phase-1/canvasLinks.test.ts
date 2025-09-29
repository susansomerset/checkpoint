import { 
  buildCanvasAssignmentUrl, 
  buildCanvasCourseUrl, 
  isValidCanvasUrl 
} from '@/lib/derive/canvasLinks'

describe('Canvas Link Helper', () => {
  describe('buildCanvasAssignmentUrl', () => {
    it('should build assignment URL with default config', () => {
      const url = buildCanvasAssignmentUrl('123', '456')
      expect(url).toBe('https://djusd.instructure.com/courses/123/assignments/456')
    })

    it('should build assignment URL with custom config', () => {
      const customConfig = { baseUrl: 'https://custom.instructure.com' }
      const url = buildCanvasAssignmentUrl('123', '456', customConfig)
      expect(url).toBe('https://custom.instructure.com/courses/123/assignments/456')
    })

    it('should handle numeric IDs', () => {
      const url = buildCanvasAssignmentUrl(123, 456)
      expect(url).toBe('https://djusd.instructure.com/courses/123/assignments/456')
    })

    it('should remove trailing slash from base URL', () => {
      const config = { baseUrl: 'https://djusd.instructure.com/' }
      const url = buildCanvasAssignmentUrl('123', '456', config)
      expect(url).toBe('https://djusd.instructure.com/courses/123/assignments/456')
    })
  })

  describe('buildCanvasCourseUrl', () => {
    it('should build course URL with default config', () => {
      const url = buildCanvasCourseUrl('123')
      expect(url).toBe('https://djusd.instructure.com/courses/123')
    })

    it('should build course URL with custom config', () => {
      const customConfig = { baseUrl: 'https://custom.instructure.com' }
      const url = buildCanvasCourseUrl('123', customConfig)
      expect(url).toBe('https://custom.instructure.com/courses/123')
    })

    it('should handle numeric course ID', () => {
      const url = buildCanvasCourseUrl(123)
      expect(url).toBe('https://djusd.instructure.com/courses/123')
    })
  })

  describe('isValidCanvasUrl', () => {
    it('should validate Canvas URLs', () => {
      expect(isValidCanvasUrl('https://djusd.instructure.com/courses/123')).toBe(true)
      expect(isValidCanvasUrl('https://canvas.instructure.com/courses/123')).toBe(true)
      expect(isValidCanvasUrl('https://custom.canvas.com/courses/123')).toBe(true)
    })

    it('should reject non-Canvas URLs', () => {
      expect(isValidCanvasUrl('https://google.com')).toBe(false)
      expect(isValidCanvasUrl('https://github.com')).toBe(false)
      expect(isValidCanvasUrl('not-a-url')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isValidCanvasUrl('')).toBe(false)
      expect(isValidCanvasUrl('invalid')).toBe(false)
    })
  })
})
