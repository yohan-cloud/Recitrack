import { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    if (env.NODE_ENV === 'test') {
      return
    }

    const duration = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`

    if (level === 'error') {
      console.error(message)
      return
    }

    if (level === 'warn') {
      console.warn(message)
      return
    }

    console.log(message)
  })

  next()
}

