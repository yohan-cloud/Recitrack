import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { sendPasswordResetCode } from './email.service.js'

function createResetCode() {
  return crypto.randomInt(100000, 999999).toString()
}

function profileEmail(user: { role: string; teacherProfile?: { email: string | null } | null; studentProfile?: { email: string | null } | null } | null) {
  if (!user) {
    return null
  }

  return user.role === 'TEACHER' ? user.teacherProfile?.email : user.studentProfile?.email
}

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { teacherProfile: true, studentProfile: true }
  })

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const tokenHash = await bcrypt.hash(refreshToken, 10)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      profile: user.role === 'TEACHER' ? user.teacherProfile : user.studentProfile
    }
  }
}

export async function refreshUserToken(token: string) {
  const payload = verifyRefreshToken(token)
  const storedTokens = await prisma.refreshToken.findMany({ where: { userId: payload.userId } })

  for (const storedToken of storedTokens) {
    const valid = await bcrypt.compare(token, storedToken.tokenHash)
    if (valid) {
      return { accessToken: signAccessToken(payload) }
    }
  }

  throw new Error('Invalid refresh token')
}

export async function revokeRefreshToken(token: string) {
  const payload = verifyRefreshToken(token)
  const tokens = await prisma.refreshToken.findMany({ where: { userId: payload.userId } })

  for (const entry of tokens) {
    if (await bcrypt.compare(token, entry.tokenHash)) {
      await prisma.refreshToken.delete({ where: { id: entry.id } })
      return
    }
  }
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new Error('User not found')
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    throw new Error('Current password is incorrect')
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      isFirstLogin: false
    }
  })
}

export async function requestPasswordReset(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { teacherProfile: true, studentProfile: true }
  })

  const email = profileEmail(user)
  if (!user || !email) {
    return
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() }
  })

  const code = createResetCode()
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  })

  await sendPasswordResetCode(email, code)
}

export async function resetPasswordWithCode(username: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw new Error('Invalid or expired reset code')
  }

  const resetTokens = await prisma.passwordResetToken.findMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  for (const resetToken of resetTokens) {
    if (await bcrypt.compare(code, resetToken.codeHash)) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: await bcrypt.hash(newPassword, 10),
            isFirstLogin: false
          }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() }
        }),
        prisma.refreshToken.deleteMany({ where: { userId: user.id } })
      ])
      return
    }
  }

  throw new Error('Invalid or expired reset code')
}
