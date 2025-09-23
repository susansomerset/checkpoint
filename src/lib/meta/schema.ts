import { z } from 'zod';

export const StudentMetaSchema = z.object({
  legalName: z.string().optional(),
  preferredName: z.string().optional(),
});

export const CourseMetaSchema = z.object({
  shortName: z.string().optional(),
  teacher: z.string().optional(),
  period: z.number().int().optional(),
});

export const MetaDataSchema = z.object({
  students: z.record(z.string(), StudentMetaSchema).default({}),
  courses: z.record(z.string(), CourseMetaSchema).default({}),
  autoRefresh: z.object({
    dailyFullAtMidnightPT: z.boolean().default(false),
    quickEveryMinutes: z.number().int().min(0).max(60).default(0),
  }).default({ dailyFullAtMidnightPT: false, quickEveryMinutes: 0 }),
});

export type MetaData = z.infer<typeof MetaDataSchema>;
