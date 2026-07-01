import { z } from 'zod'

export const markAnnouncementsReadSchema = z.object({
  classId: z.string().uuid(),
  announcementIds: z.array(z.string().uuid()).optional()
})
