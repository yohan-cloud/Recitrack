import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { Response } from 'express'
import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import {
  getOwnedClassOrThrow,
  getOwnedSectionOrThrow,
  getOwnedStudentOrThrow,
  getTeacherProfileOrThrow
} from '../services/ownership.service.js'
import { isUniqueConstraintError } from '../utils/prisma-errors.js'

function createTemporaryPassword() {
  return `Temp-${crypto.randomBytes(4).toString('hex')}!${crypto.randomInt(100, 999)}`
}

export async function listStudents(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined
  const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined

  if (sectionId) {
    await getOwnedSectionOrThrow(sectionId, teacher.id)
  }

  if (classId) {
    await getOwnedClassOrThrow(classId, teacher.id)
  }

  const students = await prisma.studentProfile.findMany({
    where: {
      section: { teacherId: teacher.id },
      sectionId,
      classStudents: classId ? { some: { classId } } : undefined
    },
    include: {
      user: { select: { id: true, username: true, isFirstLogin: true, createdAt: true } },
      section: true,
      classStudents: { include: { class: true } }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  })

  return res.json(students)
}

export async function createStudent(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  await getOwnedSectionOrThrow(req.body.sectionId, teacher.id)

  const classIds = req.body.classIds ?? []
  for (const classId of classIds) {
    const cls = await getOwnedClassOrThrow(classId, teacher.id)
    if (cls.sectionId !== req.body.sectionId) {
      return res.status(400).json({ message: 'Student can only be assigned to classes in their section' })
    }
  }

  const temporaryPassword = createTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        passwordHash,
        role: Role.STUDENT,
        isFirstLogin: true,
        studentProfile: {
          create: {
            studentNumber: req.body.studentNumber,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email || null,
            sectionId: req.body.sectionId
          }
        }
      },
      include: { studentProfile: true }
    })

    if (user.studentProfile && classIds.length > 0) {
      await prisma.classStudent.createMany({
        data: classIds.map((classId: string) => ({
          classId,
          studentId: user.studentProfile!.id
        })),
        skipDuplicates: true
      })
    }

    return res.status(201).json({
      temporaryPassword,
      student: user.studentProfile,
      user: {
        id: user.id,
        username: user.username,
        isFirstLogin: user.isFirstLogin
      }
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: 'Username or student number already exists' })
    }

    throw error
  }
}

export async function getStudent(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const studentId = String(req.params.id)
  const student = await getOwnedStudentOrThrow(studentId, teacher.id)

  return res.json(student)
}

export async function updateStudent(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const studentId = String(req.params.id)
  await getOwnedStudentOrThrow(studentId, teacher.id)

  if (req.body.sectionId) {
    await getOwnedSectionOrThrow(req.body.sectionId, teacher.id)
  }

  const classIds = req.body.classIds
  if (classIds) {
    for (const classId of classIds) {
      const cls = await getOwnedClassOrThrow(classId, teacher.id)
      if (req.body.sectionId && cls.sectionId !== req.body.sectionId) {
        return res.status(400).json({ message: 'Student can only be assigned to classes in their section' })
      }
    }
  }

  const { classIds: _classIds, ...profileData } = req.body
  const student = await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      ...profileData,
      email: 'email' in profileData ? profileData.email || null : undefined
    },
    include: {
      user: { select: { id: true, username: true, isFirstLogin: true } },
      section: true,
      classStudents: { include: { class: true } }
    }
  })

  if (classIds) {
    await prisma.classStudent.deleteMany({ where: { studentId: student.id } })
    if (classIds.length > 0) {
      await prisma.classStudent.createMany({
        data: classIds.map((classId: string) => ({ classId, studentId: student.id })),
        skipDuplicates: true
      })
    }
  }

  return res.json(student)
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const studentId = String(req.params.id)
  const student = await getOwnedStudentOrThrow(studentId, teacher.id)

  await prisma.user.delete({ where: { id: student.userId } })
  return res.status(204).send()
}
