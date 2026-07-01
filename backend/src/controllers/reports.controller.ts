import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getOwnedClassOrThrow, getOwnedStudentOrThrow, getTeacherProfileOrThrow } from '../services/ownership.service.js'

function parseDateRange(query: AuthenticatedRequest['query']) {
  const startDate = typeof query.startDate === 'string' ? new Date(query.startDate) : undefined
  const endDate = typeof query.endDate === 'string' ? new Date(query.endDate) : undefined

  return {
    gte: startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined,
    lte: endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined
  }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function getClassReport(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.classId)
  await getOwnedClassOrThrow(classId, teacher.id)
  const range = parseDateRange(req.query)

  const cls = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    include: { section: true }
  })
  const roster = await prisma.classStudent.findMany({
    where: { classId },
    include: { student: true },
    orderBy: { student: { lastName: 'asc' } }
  })
  const recitations = await prisma.recitation.findMany({
    where: {
      classId,
      teacherId: teacher.id,
      recitationDate: range.gte || range.lte ? range : undefined
    },
    include: { student: true },
    orderBy: { recitationDate: 'asc' }
  })

  const byStudent = new Map<string, { count: number; points: number; lastDate: Date | null }>()
  const byDate = new Map<string, { count: number; points: number }>()

  for (const recitation of recitations) {
    const currentStudent = byStudent.get(recitation.studentId) ?? { count: 0, points: 0, lastDate: null }
    currentStudent.count += 1
    currentStudent.points += recitation.points
    currentStudent.lastDate = recitation.recitationDate
    byStudent.set(recitation.studentId, currentStudent)

    const key = dateKey(recitation.recitationDate)
    const currentDate = byDate.get(key) ?? { count: 0, points: 0 }
    currentDate.count += 1
    currentDate.points += recitation.points
    byDate.set(key, currentDate)
  }

  const studentRows = roster
    .map((entry) => {
      const stats = byStudent.get(entry.studentId) ?? { count: 0, points: 0, lastDate: null }
      return {
        studentId: entry.student.id,
        studentNumber: entry.student.studentNumber,
        name: `${entry.student.firstName} ${entry.student.lastName}`,
        recitations: stats.count,
        points: stats.points,
        lastRecitationDate: stats.lastDate
      }
    })
    .sort((a, b) => b.recitations - a.recitations || a.name.localeCompare(b.name))
    .map((row, index) => ({ ...row, rank: index + 1 }))

  const dailyTrend = Array.from(byDate.entries()).map(([date, stats]) => ({
    date,
    recitations: stats.count,
    points: stats.points
  }))

  const activeStudents = studentRows.filter((row) => row.recitations > 0).length

  return res.json({
    class: cls,
    stats: {
      totalStudents: roster.length,
      totalRecitations: recitations.length,
      totalPoints: recitations.reduce((sum, recitation) => sum + recitation.points, 0),
      participationRate: roster.length > 0 ? Math.round((activeStudents / roster.length) * 1000) / 10 : 0,
      inactiveStudents: roster.length - activeStudents
    },
    dailyTrend,
    topStudents: studentRows.filter((row) => row.recitations > 0).slice(0, 5),
    inactiveStudents: studentRows.filter((row) => row.recitations === 0),
    students: studentRows
  })
}

export async function getStudentReport(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const studentId = String(req.params.studentId)
  const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined
  const student = await getOwnedStudentOrThrow(studentId, teacher.id)
  const range = parseDateRange(req.query)

  if (classId) {
    await getOwnedClassOrThrow(classId, teacher.id)
  }

  const recitations = await prisma.recitation.findMany({
    where: {
      studentId,
      teacherId: teacher.id,
      classId,
      recitationDate: range.gte || range.lte ? range : undefined
    },
    include: { class: { include: { section: true } } },
    orderBy: { recitationDate: 'desc' }
  })

  return res.json({
    student,
    stats: {
      totalRecitations: recitations.length,
      totalPoints: recitations.reduce((sum, recitation) => sum + recitation.points, 0),
      classesWithRecords: new Set(recitations.map((recitation) => recitation.classId)).size
    },
    recitations
  })
}
