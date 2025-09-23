import { z } from 'zod';

export type Id = string;

export const SubmissionStatus = z.enum([
  'missing',
  'submittedLate',
  'submittedOnTime',
  'graded',
  'noDueDate',
]);

export const SubmissionNodeSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  courseId: z.string(),
  studentId: z.string(),
  canvas: z.record(z.string(), z.any()),

  status: SubmissionStatus,
  score: z.number().optional(),
  gradedAt: z.string().optional(),
  submittedAt: z.string().optional(),
});
export type SubmissionNode = z.infer<typeof SubmissionNodeSchema>;

export const AssignmentNodeSchema = z.object({
  assignmentId: z.string(),
  courseId: z.string(),
  canvas: z.record(z.string(), z.any()),
  pointsPossible: z.number().optional(),
  link: z.string(), // html_url
  submissions: z.record(z.string(), SubmissionNodeSchema),
});
export type AssignmentNode = z.infer<typeof AssignmentNodeSchema>;

export const CourseMetaSchema = z.object({
  shortName: z.string().optional(),
  teacher: z.string().optional(),
  period: z.number().int().optional(),
});
export type CourseMeta = z.infer<typeof CourseMetaSchema>;

export const CourseNodeSchema = z.object({
  courseId: z.string(),
  canvas: z.record(z.string(), z.any()),
  meta: CourseMetaSchema,
  assignments: z.record(z.string(), AssignmentNodeSchema),
  orphanSubmissions: z.record(z.string(), SubmissionNodeSchema),
});
export type CourseNode = z.infer<typeof CourseNodeSchema>;

export const StudentMetaSchema = z.object({
  legalName: z.string().optional(),
  preferredName: z.string().optional(),
});
export type StudentMeta = z.infer<typeof StudentMetaSchema>;

export const StudentNodeSchema = z.object({
  studentId: z.string(),
  meta: StudentMetaSchema,
  courses: z.record(z.string(), CourseNodeSchema),
});
export type StudentNode = z.infer<typeof StudentNodeSchema>;

export const StudentDataSchema = z.object({
  students: z.record(z.string(), StudentNodeSchema),
});
export type StudentData = z.infer<typeof StudentDataSchema>;