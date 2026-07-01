import { z } from 'zod'

export const classCreateSchema = z.object({
  sectionId: z.string().uuid(),
  subjectName: z.string().min(1),
  scheduleDay: z.string().min(1),
  scheduleTime: z.string().min(1)
})

export const classUpdateSchema = classCreateSchema.partial()
