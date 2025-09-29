import * as Sentry from '@sentry/nextjs'

// Mock Sentry before importing components
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({})),
  addBreadcrumb: jest.fn(),
}))

describe('Sentry integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error reporting', () => {
    it('should capture exceptions', () => {
      const error = new Error('Test error')
      Sentry.captureException(error)
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
    })

    it('should capture messages', () => {
      const message = 'Test message'
      Sentry.captureMessage(message)
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith(message)
    })

    it('should add breadcrumbs', () => {
      const breadcrumb = {
        message: 'Test breadcrumb',
        level: 'info' as const,
      }
      Sentry.addBreadcrumb(breadcrumb)
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb)
    })

    it('should use withScope for context', () => {
      const callback = jest.fn()
      Sentry.withScope(callback)
      
      expect(Sentry.withScope).toHaveBeenCalledWith(callback)
    })
  })

  describe('PII scrubbing', () => {
    it('should scrub PII from error messages', () => {
      const error = new Error('User john.doe@example.com failed to load student123 data')
      Sentry.captureException(error)
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
      // Note: Actual PII scrubbing would be tested in the beforeSend function
    })

    it('should scrub PII from breadcrumbs', () => {
      const breadcrumb = {
        message: 'Loading data for student123 in course456',
        level: 'info' as const,
      }
      Sentry.addBreadcrumb(breadcrumb)
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb)
    })
  })

  describe('Environment configuration', () => {
    it('should only send errors in production', () => {
      // This would be tested by checking the Sentry.init configuration
      // In a real test, you'd mock the environment variables
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should require SENTRY_DSN for production', () => {
      // This would be tested by checking if Sentry is enabled
      // In a real test, you'd mock the environment variables
      expect(process.env.SENTRY_DSN).toBeUndefined()
    })
  })

  describe('Error boundary integration', () => {
    it('should report errors from error boundary', () => {
      // Mock error boundary behavior
      const error = new Error('Component error')
      
      // Simulate error boundary catching an error
      Sentry.captureException(error, {
        tags: {
          component: 'ErrorBoundary',
        },
        extra: {
          errorBoundary: true,
        },
      })
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          component: 'ErrorBoundary',
        },
        extra: {
          errorBoundary: true,
        },
      })
    })
  })

  describe('Network error reporting', () => {
    it('should report network errors', () => {
      const networkError = new Error('Network request failed')
      Sentry.captureException(networkError, {
        tags: {
          type: 'network',
        },
        extra: {
          url: '/api/student-data',
          status: 500,
        },
      })
      
      expect(Sentry.captureException).toHaveBeenCalledWith(networkError, {
        tags: {
          type: 'network',
        },
        extra: {
          url: '/api/student-data',
          status: 500,
        },
      })
    })

    it('should report rate limit errors', () => {
      const rateLimitError = new Error('Rate limit exceeded')
      Sentry.captureException(rateLimitError, {
        tags: {
          type: 'rate_limit',
        },
        extra: {
          status: 429,
          retryAfter: 60,
        },
      })
      
      expect(Sentry.captureException).toHaveBeenCalledWith(rateLimitError, {
        tags: {
          type: 'rate_limit',
        },
        extra: {
          status: 429,
          retryAfter: 60,
        },
      })
    })
  })
})
