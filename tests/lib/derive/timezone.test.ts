import {
  getCurrentDatePacific,
  getWeekStartPacific,
  getWeekEndPacific,
  isWeekend,
  mapWeekendToMonday,
  getWeekGridColumn,
  isCurrentDay,
  calculateWeekdaysBetween,
  isOverdueByMoreThanOneWeekday,
  getPreviousWeekday,
  formatDateForGrid,
  getWeekRangeString,
} from '@/lib/derive/weekWindow'

// Mock timezone for consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z') // Monday 2:00 AM PST

describe('timezone utilities', () => {
  beforeEach(() => {
    // Mock Date.now() to return a consistent time
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getCurrentDatePacific', () => {
    it('should return current date in Pacific timezone', () => {
      const pacificDate = getCurrentDatePacific()
      expect(pacificDate).toBeInstanceOf(Date)
    })
  })

  describe('getWeekStartPacific', () => {
    it('should return Monday for a Monday date', () => {
      const monday = new Date('2024-01-15T10:00:00Z') // Monday
      const weekStart = getWeekStartPacific(monday)
      expect(weekStart.getDay()).toBe(1) // Monday
    })

    it('should return Monday for a Sunday date', () => {
      const sunday = new Date('2024-01-14T10:00:00Z') // Sunday
      const weekStart = getWeekStartPacific(sunday)
      expect(weekStart.getDay()).toBe(1) // Monday
    })

    it('should return Monday for a Saturday date', () => {
      const saturday = new Date('2024-01-13T10:00:00Z') // Saturday
      const weekStart = getWeekStartPacific(saturday)
      expect(weekStart.getDay()).toBe(1) // Monday
    })
  })

  describe('getWeekEndPacific', () => {
    it('should return Sunday for a Monday date', () => {
      const monday = new Date('2024-01-15T10:00:00Z') // Monday
      const weekEnd = getWeekEndPacific(monday)
      expect(weekEnd.getDay()).toBe(0) // Sunday
    })
  })

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-13T10:00:00Z')
      expect(isWeekend(saturday)).toBe(true)
    })

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-14T10:00:00Z')
      expect(isWeekend(sunday)).toBe(true)
    })

    it('should return false for Monday', () => {
      const monday = new Date('2024-01-15T10:00:00Z')
      expect(isWeekend(monday)).toBe(false)
    })
  })

  describe('mapWeekendToMonday', () => {
    it('should return same date for weekday', () => {
      const monday = new Date('2024-01-15T10:00:00Z')
      const mapped = mapWeekendToMonday(monday)
      expect(mapped).toEqual(monday)
    })

    it('should map Saturday to Monday', () => {
      const saturday = new Date('2024-01-13T10:00:00Z')
      const mapped = mapWeekendToMonday(saturday)
      expect(mapped.getDay()).toBe(1) // Monday
    })

    it('should map Sunday to Monday', () => {
      const sunday = new Date('2024-01-14T10:00:00Z')
      const mapped = mapWeekendToMonday(sunday)
      expect(mapped.getDay()).toBe(1) // Monday
    })
  })

  describe('getWeekGridColumn', () => {
    it('should return 0 for past due assignments', () => {
      const pastDue = new Date('2024-01-10T23:59:59Z') // Last week
      const column = getWeekGridColumn(pastDue, mockDate)
      expect(column).toBe(0)
    })

    it('should return 1-5 for current week weekdays', () => {
      const monday = new Date('2024-01-15T23:59:59Z') // Monday
      const tuesday = new Date('2024-01-16T23:59:59Z') // Tuesday
      const friday = new Date('2024-01-19T23:59:59Z') // Friday
      
      expect(getWeekGridColumn(monday, mockDate)).toBe(1)
      expect(getWeekGridColumn(tuesday, mockDate)).toBe(2)
      expect(getWeekGridColumn(friday, mockDate)).toBe(5)
    })

    it('should return 1 for weekend assignments in current week', () => {
      const saturday = new Date('2024-01-20T23:59:59Z') // Saturday
      const sunday = new Date('2024-01-21T23:59:59Z') // Sunday
      
      expect(getWeekGridColumn(saturday, mockDate)).toBe(1) // Maps to Monday
      expect(getWeekGridColumn(sunday, mockDate)).toBe(1) // Maps to Monday
    })

    it('should return 6 for next week assignments', () => {
      const nextWeek = new Date('2024-01-22T23:59:59Z') // Next Monday
      const column = getWeekGridColumn(nextWeek, mockDate)
      expect(column).toBe(6)
    })

    it('should return 7 for assignments without due date', () => {
      const column = getWeekGridColumn(null, mockDate)
      expect(column).toBe(7)
    })
  })

  describe('isCurrentDay', () => {
    it('should return true for current day', () => {
      const currentDay = new Date('2024-01-15T15:00:00Z') // Same day, different time
      expect(isCurrentDay(currentDay, mockDate)).toBe(true)
    })

    it('should return false for different day', () => {
      const differentDay = new Date('2024-01-16T10:00:00Z') // Next day
      expect(isCurrentDay(differentDay, mockDate)).toBe(false)
    })
  })

  describe('calculateWeekdaysBetween', () => {
    it('should calculate weekdays between two dates', () => {
      const start = new Date('2024-01-15T10:00:00Z') // Monday
      const end = new Date('2024-01-19T10:00:00Z') // Friday
      
      const weekdays = calculateWeekdaysBetween(start, end)
      expect(weekdays).toBe(5) // Monday to Friday = 5 weekdays
    })

    it('should exclude weekends', () => {
      const start = new Date('2024-01-15T10:00:00Z') // Monday
      const end = new Date('2024-01-23T10:00:00Z') // Next Tuesday
      
      const weekdays = calculateWeekdaysBetween(start, end)
      expect(weekdays).toBe(7) // Monday to Tuesday = 7 weekdays (including both days)
    })
  })

  describe('isOverdueByMoreThanOneWeekday', () => {
    it('should return true for assignments overdue by more than 1 weekday', () => {
      const dueDate = new Date('2024-01-10T23:59:59Z') // Wednesday
      const now = new Date('2024-01-15T10:00:00Z') // Monday (3 weekdays later)
      
      expect(isOverdueByMoreThanOneWeekday(dueDate, now)).toBe(true)
    })

    it('should return false for assignments overdue by 1 weekday or less', () => {
      const dueDate = new Date('2024-01-12T23:59:59Z') // Friday
      const now = new Date('2024-01-15T10:00:00Z') // Monday (1 weekday later)
      
      expect(isOverdueByMoreThanOneWeekday(dueDate, now)).toBe(false)
    })
  })

  describe('getPreviousWeekday', () => {
    it('should return Friday for Monday', () => {
      const monday = new Date('2024-01-15T10:00:00Z') // Monday
      const previous = getPreviousWeekday(monday)
      expect(previous.getDay()).toBe(5) // Friday
    })

    it('should return Friday for Sunday', () => {
      const sunday = new Date('2024-01-14T10:00:00Z') // Sunday
      const previous = getPreviousWeekday(sunday)
      expect(previous.getDay()).toBe(6) // Saturday (previous weekday)
    })
  })

  describe('formatDateForGrid', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T23:59:59Z')
      const formatted = formatDateForGrid(date)
      expect(formatted).toMatch(/\d+\/\d+/) // Should be in M/D format
    })
  })

  describe('getWeekRangeString', () => {
    it('should return week range string', () => {
      const monday = new Date('2024-01-15T10:00:00Z') // Monday
      const range = getWeekRangeString(monday)
      expect(range).toMatch(/Jan \d+ - Jan \d+/) // Should be in "Jan D - Jan D" format
    })
  })
})
