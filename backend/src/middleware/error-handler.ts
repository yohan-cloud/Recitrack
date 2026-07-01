import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'

function getStatusCode(error: unknown) {
  if (error instanceof ZodError) {
    return 400
  }

  if (error instanceof Error && /not found/i.test(error.message)) {
    return 404
  }

  return 500
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const statusCode = getStatusCode(error)
  const message = statusCode === 500 && env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error instanceof Error
      ? error.message
      : 'Internal server error'

  console.error({
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: error instanceof Error ? error.stack : error
  })

  return res.status(statusCode).json({
    message,
    ...(env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
  })
}

