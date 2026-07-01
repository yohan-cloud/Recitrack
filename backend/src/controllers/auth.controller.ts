import { Request, Response } from 'express'
import type { CookieOptions } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { AuthenticatedRequest } from '../middleware/authenticate.js'
import { changeUserPassword, loginUser, refreshUserToken, requestPasswordReset, resetPasswordWithCode, revokeRefreshToken } from '../services/auth.service.js'

const REFRESH_COOKIE = 'refreshToken'
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.REFRESH_COOKIE_SAME_SITE,
  secure: env.REFRESH_COOKIE_SECURE ?? (env.NODE_ENV === 'production')
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as { username: string; password: string }
  const result = await loginUser(username, password)

  if (!result) {
    return res.status(401).json({ message: 'Invalid username or password' })
  }

  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  return res.json({ accessToken: result.accessToken, user: result.user })
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies[REFRESH_COOKIE]

  if (refreshToken) {
    await revokeRefreshToken(refreshToken).catch(() => undefined)
  }

  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
  return res.status(204).send()
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies[REFRESH_COOKIE]

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' })
  }

  try {
    const result = await refreshUserToken(refreshToken)
    return res.json(result)
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' })
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth.userId },
    include: { teacherProfile: true, studentProfile: true }
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
    profile: user.role === 'TEACHER' ? user.teacherProfile : user.studentProfile
  })
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string
    newPassword: string
  }

  try {
    await changeUserPassword(req.auth.userId, currentPassword, newPassword)
    return res.status(204).send()
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to change password' })
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { username } = req.body as { username: string }
  await requestPasswordReset(username)
  return res.json({ message: 'If the account has an email, a reset code has been sent.' })
}

export async function resetPassword(req: Request, res: Response) {
  const { username, code, newPassword } = req.body as {
    username: string
    code: string
    newPassword: string
  }

  try {
    await resetPasswordWithCode(username, code, newPassword)
    return res.status(204).send()
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to reset password' })
  }
}
