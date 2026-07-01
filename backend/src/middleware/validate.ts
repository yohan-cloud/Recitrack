import { NextFunction, Request, Response } from 'express'
import { z, ZodSchema } from 'zod'

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.flatten() })
      }

      next(error)
    }
  }
}
