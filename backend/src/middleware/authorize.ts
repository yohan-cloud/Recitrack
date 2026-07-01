import { NextFunction, Response } from 'express'
import { AuthenticatedRequest } from './authenticate.js'

export function authorize(...roles: Array<'TEACHER' | 'STUDENT'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    next()
  }
}
