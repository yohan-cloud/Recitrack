import { z } from 'zod'

export const teacherPreferencesSchema = z.object({
  sorting: z.enum(['alphabetical', 'studentNumber', 'mostRecitations']),
  dashboardView: z.enum(['today', 'total']),
  excludeAbsent: z.boolean(),
  avoidConsecutive: z.boolean(),
  excludeRecent: z.boolean(),
  resetDaily: z.boolean(),
  notificationDuration: z.number().int().min(5).max(10),
  theme: z.enum(['light', 'dark']),
  animations: z.boolean()
})

export const teacherSettingsUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().nullable(),
  school: z.string().trim().max(120).optional().nullable(),
  preferences: teacherPreferencesSchema
})
