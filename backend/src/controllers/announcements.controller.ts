import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getOwnedClassOrThrow, getTeacherProfileOrThrow } from '../services/ownership.service.js'

function endOfDay(dateString: string | null | undefined) {
  if (!dateString) {
    return null
  }

  return new Date(`${dateString}T23:59:59.999`)
}

export async function listAnnouncements(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined

  if (classId) {
    await getOwnedClassOrThrow(classId, teacher.id)
  }

  const announcements = await prisma.announcement.findMany({
    where: { teacherId: teacher.id, classId },
    include: {
      class: { include: { section: true } },
      section: true,
      _count: { select: { reads: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const rosterCounts = new Map<string, number>()
  await Promise.all(
    [...new Set(announcements.map((announcement) => announcement.classId))].map(async (announcementClassId) => {
      rosterCounts.set(announcementClassId, await prisma.classStudent.count({ where: { classId: announcementClassId } }))
    })
  )

  return res.json(announcements.map((announcement) => {
    const readCount = announcement._count.reads
    const rosterCount = rosterCounts.get(announcement.classId) ?? 0
    const { _count, ...payload } = announcement

    return {
      ...payload,
      readCount,
      unreadCount: Math.max(0, rosterCount - readCount)
    }
  }))
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const cls = await getOwnedClassOrThrow(req.body.classId, teacher.id)

  const announcement = await prisma.announcement.create({
    data: {
      teacherId: teacher.id,
      classId: cls.id,
      sectionId: cls.sectionId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      expiresAt: endOfDay(req.body.expiresAt)
    },
    include: { class: { include: { section: true } }, section: true }
  })

  return res.status(201).json({ ...announcement, readCount: 0, unreadCount: await prisma.classStudent.count({ where: { classId: cls.id } }) })
}

export async function updateAnnouncement(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const id = String(req.params.id)
  const existing = await prisma.announcement.findFirst({ where: { id, teacherId: teacher.id } })

  if (!existing) {
    return res.status(404).json({ message: 'Announcement not found' })
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...req.body,
      expiresAt: 'expiresAt' in req.body ? endOfDay(req.body.expiresAt) : undefined
    },
    include: { class: { include: { section: true } }, section: true }
  })

  const [readCount, rosterCount] = await Promise.all([
    prisma.announcementRead.count({ where: { announcementId: id } }),
    prisma.classStudent.count({ where: { classId: announcement.classId } })
  ])

  return res.json({ ...announcement, readCount, unreadCount: Math.max(0, rosterCount - readCount) })
}

export async function deleteAnnouncement(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const id = String(req.params.id)
  const existing = await prisma.announcement.findFirst({ where: { id, teacherId: teacher.id } })

  if (!existing) {
    return res.status(404).json({ message: 'Announcement not found' })
  }

  await prisma.announcement.delete({ where: { id } })
  return res.status(204).send()
}
