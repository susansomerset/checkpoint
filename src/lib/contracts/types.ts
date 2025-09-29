import { z } from 'zod'

// Re-export existing schemas with versioning
export const ApiVersion = z.literal('1')
export type ApiVersion = z.infer<typeof ApiVersion>

// Core types from existing schema
export const Id = z.string()
export type Id = z.infer<typeof Id>

export const SubmissionStatus = z.enum([
  'missing',
  'submittedLate', 
  'submittedOnTime',
  'graded',
  'noDueDate',
])
export type SubmissionStatus = z.infer<typeof SubmissionStatus>

export const AssignmentType = z.enum(['Pointed', 'Vector'])
export type AssignmentType = z.infer<typeof AssignmentType>

export const CheckpointStatus = z.enum([
  'Locked', 'Closed', 'Due', 'Missing', 'Vector', 'Submitted', 'Graded', 'Cancelled'
])
export type CheckpointStatus = z.infer<typeof CheckpointStatus>

// Submission schema
export const SubmissionSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  courseId: z.string(),
  studentId: z.string(),
  canvas: z.record(z.string(), z.any()),
  status: SubmissionStatus,
  score: z.number().optional(),
  gradedAt: z.string().optional(),
  submittedAt: z.string().optional(),
})
export type Submission = z.infer<typeof SubmissionSchema>

// Assignment meta schema
export const AssignmentMetaSchema = z.object({
  checkpointStatus: CheckpointStatus,
  checkpointEarnedPoints: z.number(),
  checkpointLostPoints: z.number(),
  checkpointSubmittedPoints: z.number(),
  checkpointMissingPoints: z.number(),
  assignmentType: AssignmentType,
  title: z.string().optional(),
  dueDate: z.string().optional(),
  pointValue: z.number().optional(),
})
export type AssignmentMeta = z.infer<typeof AssignmentMetaSchema>

// Assignment schema
export const AssignmentSchema = z.object({
  assignmentId: z.string(),
  courseId: z.string(),
  studentId: z.string(),
  canvas: z.record(z.string(), z.any()),
  pointsPossible: z.number().optional(),
  link: z.string(), // html_url
  submissions: z.record(z.string(), SubmissionSchema),
  meta: AssignmentMetaSchema,
})
export type Assignment = z.infer<typeof AssignmentSchema>

// Derived assignment (Assignment + computed fields)
export const DerivedAssignmentSchema = AssignmentSchema.extend({
  // Computed fields will be added by derive functions
  computedPoints: z.number(),
  computedDueDate: z.string().optional(),
  computedDaysDue: z.number().optional(),
})
export type DerivedAssignment = z.infer<typeof DerivedAssignmentSchema>

// Course meta schema
export const CourseMetaSchema = z.object({
  shortName: z.string().optional(),
  legalName: z.string().optional(),
  teacher: z.string().optional(),
  period: z.number().int().optional(),
})
export type CourseMeta = z.infer<typeof CourseMetaSchema>

// Course schema
export const CourseSchema = z.object({
  courseId: z.string(),
  canvas: z.record(z.string(), z.any()),
  meta: CourseMetaSchema,
  assignments: z.record(z.string(), AssignmentSchema),
  orphanSubmissions: z.record(z.string(), SubmissionSchema),
})
export type Course = z.infer<typeof CourseSchema>

// Student meta schema
export const StudentMetaSchema = z.object({
  legalName: z.string().optional(),
  preferredName: z.string().optional(),
})
export type StudentMeta = z.infer<typeof StudentMetaSchema>

// Student schema
export const StudentSchema = z.object({
  studentId: z.string(),
  meta: StudentMetaSchema,
  courses: z.record(z.string(), CourseSchema),
})
export type Student = z.infer<typeof StudentSchema>

// Main student data schema
export const StudentDataSchema = z.object({
  students: z.record(z.string(), StudentSchema),
  lastLoadedAt: z.string(),
  apiVersion: ApiVersion,
  version: z.number().optional(),
})
export type StudentData = z.infer<typeof StudentDataSchema>

// Metadata schema
export const MetaDataSchema = z.object({
  students: z.record(z.string(), StudentMetaSchema).default({}),
  courses: z.record(z.string(), CourseMetaSchema).default({}),
  autoRefresh: z.object({
    dailyFullAtMidnightPT: z.boolean().default(false),
    quickEveryMinutes: z.number().int().min(0).max(60).default(0),
  }).default({ dailyFullAtMidnightPT: false, quickEveryMinutes: 0 }),
  apiVersion: ApiVersion,
})
export type MetaData = z.infer<typeof MetaDataSchema>
