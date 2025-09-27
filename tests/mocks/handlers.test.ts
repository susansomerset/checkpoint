import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import { StudentDataResponseSchema, MetaDataResponseSchema } from '@/lib/contracts/api'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MSW handlers', () => {
  describe('/api/student-data', () => {
    it('should return valid student data', async () => {
      const response = await fetch('/api/student-data')
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('students')
      expect(data).toHaveProperty('lastLoadedAt')
      expect(data).toHaveProperty('apiVersion', '1')
      
      // Validate against schema
      const validatedData = StudentDataResponseSchema.parse(data)
      expect(validatedData).toBeDefined()
    })

    it('should have correct student structure', async () => {
      const response = await fetch('/api/student-data')
      const data = await response.json()
      
      const student = Object.values(data.students)[0]
      expect(student).toHaveProperty('studentId')
      expect(student).toHaveProperty('meta')
      expect(student).toHaveProperty('courses')
      
      expect(student.meta).toHaveProperty('legalName')
      expect(student.meta).toHaveProperty('preferredName')
    })

    it('should have correct course structure', async () => {
      const response = await fetch('/api/student-data')
      const data = await response.json()
      
      const student = Object.values(data.students)[0]
      const course = Object.values(student.courses)[0]
      
      expect(course).toHaveProperty('courseId')
      expect(course).toHaveProperty('canvas')
      expect(course).toHaveProperty('meta')
      expect(course).toHaveProperty('assignments')
      
      expect(course.meta).toHaveProperty('shortName')
      expect(course.meta).toHaveProperty('teacher')
      expect(course.meta).toHaveProperty('period')
    })

    it('should have correct assignment structure', async () => {
      const response = await fetch('/api/student-data')
      const data = await response.json()
      
      const student = Object.values(data.students)[0]
      const course = Object.values(student.courses)[0]
      const assignment = Object.values(course.assignments)[0]
      
      expect(assignment).toHaveProperty('assignmentId')
      expect(assignment).toHaveProperty('courseId')
      expect(assignment).toHaveProperty('canvas')
      expect(assignment).toHaveProperty('pointsPossible')
      expect(assignment).toHaveProperty('link')
      expect(assignment).toHaveProperty('submissions')
      expect(assignment).toHaveProperty('meta')
      
      expect(assignment.canvas).toHaveProperty('name')
      expect(assignment.canvas).toHaveProperty('due_at')
      expect(assignment.canvas).toHaveProperty('points_possible')
      expect(assignment.canvas).toHaveProperty('html_url')
    })
  })

  describe('/api/metadata', () => {
    it('should return valid metadata', async () => {
      const response = await fetch('/api/metadata')
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('students')
      expect(data).toHaveProperty('courses')
      expect(data).toHaveProperty('autoRefresh')
      expect(data).toHaveProperty('apiVersion', '1')
      
      // Validate against schema
      const validatedData = MetaDataResponseSchema.parse(data)
      expect(validatedData).toBeDefined()
    })

    it('should have correct autoRefresh structure', async () => {
      const response = await fetch('/api/metadata')
      const data = await response.json()
      
      expect(data.autoRefresh).toHaveProperty('dailyFullAtMidnightPT')
      expect(data.autoRefresh).toHaveProperty('quickEveryMinutes')
      expect(typeof data.autoRefresh.dailyFullAtMidnightPT).toBe('boolean')
      expect(typeof data.autoRefresh.quickEveryMinutes).toBe('number')
    })
  })

  describe('error scenarios', () => {
    it('should handle 500 error', async () => {
      const response = await fetch('/api/student-data/error')
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Internal Server Error')
      expect(data).toHaveProperty('message', 'Something went wrong')
      expect(data).toHaveProperty('statusCode', 500)
    })

    it('should handle 403 error', async () => {
      const response = await fetch('/api/student-data/forbidden')
      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Forbidden')
      expect(data).toHaveProperty('message', 'Access denied')
      expect(data).toHaveProperty('statusCode', 403)
    })

    it('should handle network error', async () => {
      await expect(fetch('/api/student-data/network-error')).rejects.toThrow()
    })
  })

  describe('update endpoints', () => {
    it('should handle POST /api/student-data/update', async () => {
      const response = await fetch('/api/student-data/update', { method: 'POST' })
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message', 'Data updated successfully')
    })

    it('should handle POST /api/student-data/reset', async () => {
      const response = await fetch('/api/student-data/reset', { method: 'POST' })
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message', 'Data reset successfully')
    })
  })
})
