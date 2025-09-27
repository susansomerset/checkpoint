import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN,
  
  // Sample rate for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
  // Sample rate for error monitoring
  sampleRate: 1.0,
  
  // PII scrubbing
  beforeSend(event, hint) {
    // Remove PII from error messages
    if (event.exception) {
      event.exception.values?.forEach(exception => {
        if (exception.value) {
          // Remove names, emails, and other PII
          exception.value = exception.value
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
            .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
            .replace(/\bstudent\d+\b/g, '[STUDENT_ID]')
            .replace(/\bcourse\d+\b/g, '[COURSE_ID]')
        }
      })
    }
    
    // Remove PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
            .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
            .replace(/\bstudent\d+\b/g, '[STUDENT_ID]')
            .replace(/\bcourse\d+\b/g, '[COURSE_ID]')
        }
        return breadcrumb
      })
    }
    
    return event
  },
  
  // Add breadcrumbs for network requests
  integrations: [
    // Browser tracing integration will be added when needed
  ],
})
