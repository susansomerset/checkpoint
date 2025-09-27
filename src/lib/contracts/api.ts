import { z } from 'zod'
import { StudentDataSchema, MetaDataSchema } from './types'

// API response schemas with versioning
export const StudentDataResponseSchema = StudentDataSchema
export type StudentDataResponse = z.infer<typeof StudentDataResponseSchema>

export const MetaDataResponseSchema = MetaDataSchema
export type MetaDataResponse = z.infer<typeof MetaDataResponseSchema>

// API error response schema
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  apiVersion: z.literal('1'),
})
export type ApiError = z.infer<typeof ApiErrorSchema>

// API success response wrapper
export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.union([StudentDataResponseSchema, MetaDataResponseSchema]),
  apiVersion: z.literal('1'),
})
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>

// Generic API response
export const ApiResponseSchema = z.union([ApiSuccessSchema, ApiErrorSchema])
export type ApiResponse = z.infer<typeof ApiResponseSchema>

// Contract validation helper
export const validateApiResponse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Contract validation failed:', error.errors)
      throw new Error(`API contract violation: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// Contract version check
export const checkApiVersion = (data: unknown): boolean => {
  try {
    const parsed = z.object({ apiVersion: z.literal('1') }).parse(data)
    return parsed.apiVersion === '1'
  } catch {
    return false
  }
}
