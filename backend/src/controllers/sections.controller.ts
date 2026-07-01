import { Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { getOwnedSectionOrThrow, getTeacherProfileOrThrow } from '../services/ownership.service.js'
import { isForeignKeyConstraintError } from '../utils/prisma-errors.js'

export async function listSections(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const sections = await prisma.section.findMany({
    where: { teacherId: teacher.id },
    include: {
      _count: { select: { students: true, classes: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(sections)
}

export async function createSection(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const section = await prisma.section.create({
    data: {
      teacherId: teacher.id,
      name: req.body.name,
      gradeLevel: req.body.gradeLevel
    }
  })

  return res.status(201).json(section)
}

export async function updateSection(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const sectionId = String(req.params.id)
  await getOwnedSectionOrThrow(sectionId, teacher.id)

  const section = await prisma.section.update({
    where: { id: sectionId },
    data: req.body
  })

  return res.json(section)
}

export async function deleteSection(req: AuthenticatedRequest, res: Response) {
  const teacher = await getTeacherProfileOrThrow(req.auth!.userId)
  const sectionId = String(req.params.id)
  await getOwnedSectionOrThrow(sectionId, teacher.id)

  try {
    await prisma.section.delete({ where: { id: sectionId } })
    return res.status(204).send()
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      return res.status(409).json({ message: 'Remove linked students or classes before deleting this section' })
    }

    throw error
  }
}
