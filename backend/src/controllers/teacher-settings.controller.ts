import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getTeacherProfileOrThrow } from '../services/ownership.service.js'

const defaultPreferences = {
  sorting: 'alphabetical',
  dashboardView: 'today',
  excludeAbsent: true,
  avoidConsecutive: true,
  excludeRecent: false,
  resetDaily: true,
  notificationDuration: 6,
  theme: 'light',
  animations: true
}

function toSettingsResponse(teacher: Awaited<ReturnType<typeof getTeacherProfileOrThrow>>) {
  return {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email ?? '',
    school: teacher.school ?? '',
    preferences: {
      ...defaultPreferences,
      ...((teacher.preferences ?? {}) as Record<string, unknown>)
    }
  }
}

export async function getTeacherSettings(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  return res.json(toSettingsResponse(teacher))
}

export async function updateTeacherSettings(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const updated = await prisma.teacherProfile.update({
    where: { id: teacher.id },
    data: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email || null,
      school: req.body.school || null,
      preferences: req.body.preferences
    }
  })

  return res.json(toSettingsResponse(updated))
}
