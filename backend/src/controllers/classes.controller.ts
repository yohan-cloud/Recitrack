import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getOwnedClassOrThrow, getOwnedSectionOrThrow, getTeacherProfileOrThrow } from '../services/ownership.service.js'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

export async function listClasses(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined

  if (sectionId) {
    await getOwnedSectionOrThrow(sectionId, teacher.id)
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id, sectionId },
    include: {
      section: true,
      _count: { select: { classStudents: true, recitations: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(classes)
}

export async function createClass(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  await getOwnedSectionOrThrow(req.body.sectionId, teacher.id)

  const cls = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      sectionId: req.body.sectionId,
      subjectName: req.body.subjectName,
      scheduleDay: req.body.scheduleDay,
      scheduleTime: req.body.scheduleTime
    },
    include: { section: true }
  })

  return res.status(201).json(cls)
}

export async function getClass(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.id)
  await getOwnedClassOrThrow(classId, teacher.id)

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      section: true,
      classStudents: {
        include: {
          student: {
            include: { section: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      recitations: {
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { student: true }
      }
    }
  })

  return res.json(cls)
}

export async function updateClass(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.id)
  await getOwnedClassOrThrow(classId, teacher.id)

  if (req.body.sectionId) {
    await getOwnedSectionOrThrow(req.body.sectionId, teacher.id)
  }

  const cls = await prisma.class.update({
    where: { id: classId },
    data: req.body,
    include: { section: true }
  })

  return res.json(cls)
}

export async function deleteClass(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.id)
  await getOwnedClassOrThrow(classId, teacher.id)

  await prisma.class.delete({ where: { id: classId } })
  return res.status(204).send()
}

export async function getClassDashboard(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.id)
  await getOwnedClassOrThrow(classId, teacher.id)
  const cls = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    include: { section: true }
  })
  const { start, end } = todayRange()

  const totalStudents = await prisma.classStudent.count({ where: { classId: cls.id } })
  const todayRecitations = await prisma.recitation.count({
    where: {
      classId: cls.id,
      recitationDate: { gte: start, lt: end }
    }
  })
  const participatedToday = await prisma.recitation.findMany({
    where: {
      classId: cls.id,
      recitationDate: { gte: start, lt: end }
    },
    distinct: ['studentId'],
    select: { studentId: true }
  })
  const mostActive = await prisma.recitation.groupBy({
    by: ['studentId'],
    where: { classId: cls.id },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  })

  const mostActiveStudent = mostActive[0]
    ? await prisma.studentProfile.findUnique({ where: { id: mostActive[0].studentId } })
    : null

  const recentRecitations = await prisma.recitation.findMany({
    where: { classId: cls.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { student: true }
  })

  return res.json({
    class: cls,
    stats: {
      totalStudents,
      todayRecitations,
      participationRate: totalStudents > 0 ? Math.round((participatedToday.length / totalStudents) * 1000) / 10 : 0,
      mostActiveStudent: mostActiveStudent
        ? {
            id: mostActiveStudent.id,
            name: `${mostActiveStudent.firstName} ${mostActiveStudent.lastName}`,
            recitations: mostActive[0]._count.id,
            points: mostActive[0]._sum.points ?? 0
          }
        : null
    },
    recentRecitations
  })
}
