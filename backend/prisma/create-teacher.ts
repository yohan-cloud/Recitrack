import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL
const username = process.env.TEACHER_USERNAME
const password = process.env.TEACHER_PASSWORD
const firstName = process.env.TEACHER_FIRST_NAME
const lastName = process.env.TEACHER_LAST_NAME
const email = process.env.TEACHER_EMAIL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.')
}

if (!username || !password || !firstName || !lastName) {
  throw new Error('TEACHER_USERNAME, TEACHER_PASSWORD, TEACHER_FIRST_NAME, and TEACHER_LAST_NAME are required.')
}

if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
  throw new Error('TEACHER_PASSWORD must be at least 10 characters and include uppercase, lowercase, number, and symbol.')
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash(password!, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: Role.TEACHER,
      isFirstLogin: false,
      teacherProfile: {
        upsert: {
          update: { firstName, lastName, email: email || null },
          create: { firstName, lastName, email: email || null }
        }
      }
    },
    create: {
      username,
      passwordHash,
      role: Role.TEACHER,
      isFirstLogin: false,
      teacherProfile: {
        create: { firstName, lastName, email: email || null }
      }
    },
    include: { teacherProfile: true }
  })

  console.log(`Teacher account ready: ${user.username}`)
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
