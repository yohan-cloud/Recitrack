import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import {
  getOwnedClassOrThrow,
  getOwnedRecitationOrThrow,
  getStudentInOwnedClassOrThrow,
  getTeacherProfileOrThrow
} from '../services/ownership.service.js'

export async function createRecitation(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  await getOwnedClassOrThrow(req.body.classId, teacher.id)
  await getStudentInOwnedClassOrThrow(req.body.studentId, req.body.classId, teacher.id)

  const recitation = await prisma.recitation.create({
    data: {
      studentId: req.body.studentId,
      classId: req.body.classId,
      teacherId: teacher.id,
      points: req.body.points ?? 1,
      remarks: req.body.remarks,
      recitationDate: req.body.recitationDate ?? new Date()
    },
    include: { student: true, class: true }
  })

  return res.status(201).json(recitation)
}

export async function deleteRecitation(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const recitationId = String(req.params.id)
  await getOwnedRecitationOrThrow(recitationId, teacher.id)

  await prisma.recitation.delete({ where: { id: recitationId } })
  return res.status(204).send()
}

export async function listClassRecitations(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const classId = String(req.params.classId)
  await getOwnedClassOrThrow(classId, teacher.id)

  const recitations = await prisma.recitation.findMany({
    where: { classId, teacherId: teacher.id },
    include: { student: true },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(recitations)
}
