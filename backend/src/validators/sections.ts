import { z } from 'zod'

export const sectionCreateSchema = z.object({
  name: z.string().min(1),
  gradeLevel: z.string().min(1)
})

export const sectionUpdateSchema = sectionCreateSchema.partial()
