import { z } from 'zod'

const requiredDateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date is required.')

export const announcementCreateSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1000),
  type: z.enum(['NORMAL', 'IMPORTANT', 'REMINDER', 'ASSIGNMENT']).default('NORMAL'),
  expiresAt: requiredDateSchema
})

export const announcementUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(1000).optional(),
  type: z.enum(['NORMAL', 'IMPORTANT', 'REMINDER', 'ASSIGNMENT']).optional(),
  expiresAt: requiredDateSchema.optional()
})
