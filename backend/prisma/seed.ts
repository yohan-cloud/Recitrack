import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.')
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })

const demoSections = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'STEM - A',
    gradeLevel: 'Grade 11'
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'HUMSS - B',
    gradeLevel: 'Grade 11'
  }
]

const demoClasses = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    sectionId: demoSections[0].id,
    subjectName: 'Oral Communication',
    scheduleDay: 'Monday',
    scheduleTime: '08:00 AM - 09:30 AM'
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    sectionId: demoSections[0].id,
    subjectName: 'General Mathematics',
    scheduleDay: 'Wednesday',
    scheduleTime: '10:00 AM - 11:30 AM'
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    sectionId: demoSections[1].id,
    subjectName: 'Reading and Writing',
    scheduleDay: 'Tuesday',
    scheduleTime: '01:00 PM - 02:30 PM'
  }
]

const demoStudents = [
  {
    username: 'student.demo',
    studentNumber: '2026-0001',
    firstName: 'Alex',
    lastName: 'Rivera',
    sectionId: demoSections[0].id,
    classIds: [demoClasses[0].id, demoClasses[1].id]
  },
  {
    username: 'maria.lopez',
    studentNumber: '2026-0002',
    firstName: 'Maria',
    lastName: 'Lopez',
    sectionId: demoSections[0].id,
    classIds: [demoClasses[0].id, demoClasses[1].id]
  },
  {
    username: 'john.cruz',
    studentNumber: '2026-0003',
    firstName: 'John',
    lastName: 'Cruz',
    sectionId: demoSections[0].id,
    classIds: [demoClasses[0].id]
  },
  {
    username: 'mica.santos',
    studentNumber: '2026-0004',
    firstName: 'Mica',
    lastName: 'Santos',
    sectionId: demoSections[0].id,
    classIds: [demoClasses[0].id, demoClasses[1].id]
  },
  {
    username: 'bea.garcia',
    studentNumber: '2026-0005',
    firstName: 'Bea',
    lastName: 'Garcia',
    sectionId: demoSections[1].id,
    classIds: [demoClasses[2].id]
  },
  {
    username: 'nathan.reyes',
    studentNumber: '2026-0006',
    firstName: 'Nathan',
    lastName: 'Reyes',
    sectionId: demoSections[1].id,
    classIds: [demoClasses[2].id]
  }
]

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(9 + (days % 5), 15, 0, 0)
  return date
}

async function main() {
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher.demo' },
    update: {},
    create: {
      username: 'teacher.demo',
      passwordHash: teacherPassword,
      role: Role.TEACHER,
      isFirstLogin: false,
      teacherProfile: {
        create: {
          firstName: 'Mia',
          lastName: 'Santos',
          email: 'teacher.demo@example.com'
        }
      }
    },
    include: { teacherProfile: true }
  })

  if (!teacherUser.teacherProfile) {
    throw new Error('Teacher profile was not created.')
  }

  for (const section of demoSections) {
    await prisma.section.upsert({
      where: { id: section.id },
      update: {
        name: section.name,
        gradeLevel: section.gradeLevel
      },
      create: {
        ...section,
        teacherId: teacherUser.teacherProfile.id
      }
    })
  }

  for (const cls of demoClasses) {
    await prisma.class.upsert({
      where: { id: cls.id },
      update: {
        sectionId: cls.sectionId,
        subjectName: cls.subjectName,
        scheduleDay: cls.scheduleDay,
        scheduleTime: cls.scheduleTime
      },
      create: {
        ...cls,
        teacherId: teacherUser.teacherProfile.id
      }
    })
  }

  const students = []

  for (const student of demoStudents) {
    const studentUser = await prisma.user.upsert({
      where: { username: student.username },
      update: {},
      create: {
        username: student.username,
        passwordHash: studentPassword,
        role: Role.STUDENT,
        isFirstLogin: true,
        studentProfile: {
          create: {
            studentNumber: student.studentNumber,
            firstName: student.firstName,
            lastName: student.lastName,
            email: `${student.username}@example.com`,
            sectionId: student.sectionId
          }
        }
      },
      include: { studentProfile: true }
    })

    if (!studentUser.studentProfile) {
      throw new Error(`Student profile was not created for ${student.username}.`)
    }

    students.push({ ...student, id: studentUser.studentProfile.id })

    await prisma.studentProfile.update({
      where: { id: studentUser.studentProfile.id },
      data: {
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: `${student.username}@example.com`,
        sectionId: student.sectionId
      }
    })

    for (const classId of student.classIds) {
      await prisma.classStudent.upsert({
        where: {
          classId_studentId: {
            classId,
            studentId: studentUser.studentProfile.id
          }
        },
        update: {},
        create: {
          classId,
          studentId: studentUser.studentProfile.id
        }
      })
    }
  }

  await prisma.recitation.deleteMany({
    where: {
      teacherId: teacherUser.teacherProfile.id,
      classId: { in: demoClasses.map((cls) => cls.id) }
    }
  })

  const studentByUsername = new Map(students.map((student) => [student.username, student]))
  const recitations = [
    ['student.demo', demoClasses[0].id, 1, 'Volunteered answer', 0],
    ['maria.lopez', demoClasses[0].id, 2, 'Strong explanation', 0],
    ['john.cruz', demoClasses[0].id, 1, 'Follow-up response', 1],
    ['mica.santos', demoClasses[0].id, 1, 'Asked a clarifying question', 1],
    ['student.demo', demoClasses[0].id, 1, 'Connected example to lesson', 2],
    ['maria.lopez', demoClasses[0].id, 1, 'Answered warm-up prompt', 3],
    ['student.demo', demoClasses[0].id, 2, 'Presented group answer', 5],
    ['mica.santos', demoClasses[0].id, 1, 'Shared evidence from text', 6],
    ['student.demo', demoClasses[1].id, 1, 'Solved board problem', 0],
    ['maria.lopez', demoClasses[1].id, 1, 'Explained formula step', 2],
    ['mica.santos', demoClasses[1].id, 2, 'Completed challenge item', 4],
    ['bea.garcia', demoClasses[2].id, 1, 'Read passage analysis', 1],
    ['nathan.reyes', demoClasses[2].id, 1, 'Shared thesis revision', 3],
    ['bea.garcia', demoClasses[2].id, 2, 'Led peer feedback', 5]
  ] as const

  for (const [username, classId, points, remarks, dayOffset] of recitations) {
    const student = studentByUsername.get(username)
    if (!student) {
      continue
    }

    await prisma.recitation.create({
      data: {
        studentId: student.id,
        classId,
        teacherId: teacherUser.teacherProfile.id,
        points,
        remarks,
        recitationDate: daysAgo(dayOffset)
      }
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
