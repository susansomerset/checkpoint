import { fetchStudentData, fetchStudentDataWithRetry, abortAllRequests } from '@/lib/api/studentData'

// Mock fetch
global.fetch = jest.fn()

describe('Student Data API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    abortAllRequests()
  })

  describe('fetchStudentData', () => {
    it('should fetch data successfully', async () => {
      const mockData = {
        students: {},
        lastLoadedAt: '2024-01-01T00:00:00Z',
        apiVersion: '1' as const,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await fetchStudentData()

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: mockData,
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/student-data', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1',
        },
      })
    })

    it('should fetch data for specific student', async () => {
      const mockData = {
        students: {},
        lastLoadedAt: '2024-01-01T00:00:00Z',
        apiVersion: '1' as const,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await fetchStudentData('student123')

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: mockData,
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/student-data?studentId=student123', {
        signal: expect.any(AbortSignal),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1',
        },
      })
    })

    it('should handle HTTP error responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await fetchStudentData()

      expect(result).toEqual({
        ok: false,
        status: 404,
        error: 'HTTP 404: Not Found',
      })
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchStudentData()

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: 'Network error',
      })
    })

    it('should handle abort errors', async () => {
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(abortError)

      const result = await fetchStudentData()

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: 'Request aborted',
      })
    })

    it('should handle JSON parsing errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await fetchStudentData()

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: 'Invalid JSON',
      })
    })
  })

  describe('fetchStudentDataWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockData = {
        students: {},
        lastLoadedAt: '2024-01-01T00:00:00Z',
        apiVersion: '1' as const,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await fetchStudentDataWithRetry()

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: mockData,
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on server errors with exponential backoff', async () => {
      const mockData = {
        students: {},
        lastLoadedAt: '2024-01-01T00:00:00Z',
        apiVersion: '1' as const,
      }

      // First two calls fail, third succeeds
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData,
        })

      const result = await fetchStudentDataWithRetry(undefined, 3, 100)

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: mockData,
      })

      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry on client errors (4xx)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      const result = await fetchStudentDataWithRetry(undefined, 3, 100)

      expect(result).toEqual({
        ok: false,
        status: 400,
        error: 'HTTP 400: Bad Request',
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should fail after max retries', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await fetchStudentDataWithRetry(undefined, 2, 10)

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: 'Failed after 3 attempts: HTTP 500: Internal Server Error',
      })

      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should handle network errors with retry', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ students: {}, lastLoadedAt: '2024-01-01T00:00:00Z', apiVersion: '1' }),
        })

      const result = await fetchStudentDataWithRetry(undefined, 3, 10)

      expect(result.ok).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Request deduplication', () => {
    it('should cancel previous request when new request is made', async () => {
      const mockData = {
        students: {},
        lastLoadedAt: '2024-01-01T00:00:00Z',
        apiVersion: '1' as const,
      }

      // Mock a slow first request
      let firstRequestResolve: () => void
      const firstRequestPromise = new Promise(resolve => {
        firstRequestResolve = resolve
      })

      ;(global.fetch as jest.Mock)
        .mockReturnValueOnce(firstRequestPromise)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData,
        })

      // Start first request
      const firstRequest = fetchStudentData('student1')
      
      // Start second request (should cancel first)
      const secondRequest = fetchStudentData('student1')

      // Resolve first request
      firstRequestResolve!()

      const result = await secondRequest

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: mockData,
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('abortAllRequests', () => {
    it('should abort all active requests', async () => {
      // Mock requests that will be aborted
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((resolve, reject) => {
          // Simulate a request that gets aborted
          setTimeout(() => {
            const abortError = new Error('Request aborted')
            abortError.name = 'AbortError'
            reject(abortError)
          }, 10)
        })
      })

      // Start multiple requests
      const request1 = fetchStudentData('student1')
      const request2 = fetchStudentData('student2')

      // Abort all requests immediately
      abortAllRequests()

      const result1 = await request1
      const result2 = await request2

      expect(result1).toEqual({
        ok: false,
        status: 0,
        error: 'Request aborted',
      })

      expect(result2).toEqual({
        ok: false,
        status: 0,
        error: 'Request aborted',
      })
    })
  })
})
