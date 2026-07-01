import { prisma } from '../lib/prisma.js'

export async function getTeacherProfileOrThrow(userId: string) {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId }
  })

  if (!teacher) {
    throw new Error('Teacher profile not found')
  }

  return teacher
}

export async function getOwnedSectionOrThrow(sectionId: string, teacherId: string) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, teacherId }
  })

  if (!section) {
    throw new Error('Section not found')
  }

  return section
}

export async function getOwnedClassOrThrow(classId: string, teacherId: string) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  })

  if (!cls) {
    throw new Error('Class not found')
  }

  return cls
}

export async function getOwnedStudentOrThrow(studentId: string, teacherId: string) {
  const student = await prisma.studentProfile.findFirst({
    where: {
      id: studentId,
      section: { teacherId }
    },
    include: {
      user: true,
      section: true,
      classStudents: { include: { class: true } }
    }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  return student
}

export async function getStudentInOwnedClassOrThrow(studentId: string, classId: string, teacherId: string) {
  const classStudent = await prisma.classStudent.findFirst({
    where: {
      studentId,
      classId,
      class: { teacherId },
      student: { section: { teacherId } }
    },
    include: {
      class: true,
      student: true
    }
  })

  if (!classStudent) {
    throw new Error('Student is not enrolled in this class')
  }

  return classStudent
}

export async function getOwnedRecitationOrThrow(recitationId: string, teacherId: string) {
  const recitation = await prisma.recitation.findFirst({
    where: { id: recitationId, teacherId },
    include: { student: true, class: true }
  })

  if (!recitation) {
    throw new Error('Recitation not found')
  }

  return recitation
}
