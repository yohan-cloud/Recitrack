import { z } from 'zod'

export const studentCreateSchema = z.object({
  username: z.string().min(3),
  studentNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().trim().email().optional().nullable(),
  sectionId: z.string().uuid(),
  classIds: z.array(z.string().uuid()).optional()
})

export const studentUpdateSchema = z.object({
  studentNumber: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().trim().email().optional().nullable(),
  sectionId: z.string().uuid().optional(),
  classIds: z.array(z.string().uuid()).optional()
})
