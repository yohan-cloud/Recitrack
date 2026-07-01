import { z } from 'zod'

export const recitationCreateSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  points: z.coerce.number().int().min(1).max(10).default(1),
  remarks: z.string().max(240).optional(),
  recitationDate: z.coerce.date().optional()
})
