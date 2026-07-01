import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getStudentProfileOrThrow } from '../services/student.service.js'

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
}

export async function listMyClasses(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const classStudents = await prisma.classStudent.findMany({
    where: { studentId: student.id },
    include: {
      class: {
        include: { section: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(classStudents.map((entry) => entry.class))
}

export async function getMyDashboard(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.classId)

  const enrollment = await prisma.classStudent.findFirst({
    where: { studentId: student.id, classId },
    include: { class: { include: { section: true } } }
  })

  if (!enrollment) {
    return res.status(404).json({ message: 'Class not found' })
  }

  const { start, end } = monthRange()
  const [totalRecitations, thisMonth, classRoster, recentRecitations] = await Promise.all([
    prisma.recitation.count({ where: { classId, studentId: student.id } }),
    prisma.recitation.count({ where: { classId, studentId: student.id, recitationDate: { gte: start, lt: end } } }),
    prisma.classStudent.findMany({ where: { classId }, select: { studentId: true } }),
    prisma.recitation.findMany({
      where: { classId, studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { class: { include: { section: true } } }
    })
  ])

  const grouped = await prisma.recitation.groupBy({
    by: ['studentId'],
    where: { classId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  })

  const rankIndex = grouped.findIndex((entry) => entry.studentId === student.id)
  const rank = rankIndex >= 0 ? rankIndex + 1 : null
  const classAverage = classRoster.length > 0
    ? Math.round((grouped.reduce((sum, entry) => sum + entry._count.id, 0) / classRoster.length) * 10) / 10
    : 0

  return res.json({
    class: enrollment.class,
    stats: {
      totalRecitations,
      currentRank: rank,
      thisMonth,
      classAverageParticipation: classAverage
    },
    recentRecitations
  })
}

export async function listMyRecitations(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined

  if (classId) {
    const enrollment = await prisma.classStudent.findFirst({
      where: { studentId: student.id, classId }
    })

    if (!enrollment) {
      return res.status(404).json({ message: 'Class not found' })
    }
  }

  const recitations = await prisma.recitation.findMany({
    where: { studentId: student.id, classId },
    include: {
      class: { include: { section: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(recitations)
}

export async function listMyAnnouncements(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined

  if (!classId) {
    return res.status(400).json({ message: 'classId is required' })
  }

  const enrollment = await prisma.classStudent.findFirst({
    where: { studentId: student.id, classId }
  })

  if (!enrollment) {
    return res.status(404).json({ message: 'Class not found' })
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      classId,
      sectionId: student.sectionId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    },
    include: {
      class: { include: { section: true } },
      section: true,
      reads: { where: { studentId: student.id }, select: { readAt: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return res.json(announcements.map((announcement) => {
    const readAt = announcement.reads[0]?.readAt ?? null
    const { reads, ...payload } = announcement

    return {
      ...payload,
      isRead: Boolean(readAt),
      readAt
    }
  }))
}

export async function markMyAnnouncementsRead(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const classId = typeof req.body.classId === 'string' ? req.body.classId : undefined
  const announcementIds = Array.isArray(req.body.announcementIds) ? req.body.announcementIds.filter((id: unknown) => typeof id === 'string') : undefined

  if (!classId) {
    return res.status(400).json({ message: 'classId is required' })
  }

  const enrollment = await prisma.classStudent.findFirst({
    where: { studentId: student.id, classId }
  })

  if (!enrollment) {
    return res.status(404).json({ message: 'Class not found' })
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      classId,
      sectionId: student.sectionId,
      id: announcementIds ? { in: announcementIds } : undefined,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    },
    select: { id: true }
  })

  await prisma.announcementRead.createMany({
    data: announcements.map((announcement) => ({ announcementId: announcement.id, studentId: student.id })),
    skipDuplicates: true
  })

  return res.json({ markedRead: announcements.length })
}

export async function getMyUnreadAnnouncementCount(req: AuthenticatedRequest, res: Response) {
  const student = await getStudentProfileOrThrow(req.auth!.userId)
  const enrollments = await prisma.classStudent.findMany({
    where: { studentId: student.id },
    select: { classId: true }
  })

  const classIds = enrollments.map((enrollment) => enrollment.classId)
  const unreadCount = classIds.length === 0
    ? 0
    : await prisma.announcement.count({
      where: {
        classId: { in: classIds },
        sectionId: student.sectionId,
        reads: { none: { studentId: student.id } },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    })

  return res.json({ unreadCount })
}
