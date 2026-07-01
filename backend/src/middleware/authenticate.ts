import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string
    username: string
    role: 'TEACHER' | 'STUDENT'
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    req.auth = verifyAccessToken(token)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
