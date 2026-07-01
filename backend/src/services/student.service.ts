import { prisma } from '../lib/prisma.js'

export async function getStudentProfileOrThrow(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { section: true, user: true }
  })

  if (!student) {
    throw new Error('Student profile not found')
  }

  return student
}
