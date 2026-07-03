import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { requestLogger } from './middleware/request-logger.js'
import { apiRouter } from './routes/index.js'

export const app = express()
const allowedOrigins = new Set(
  env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL]
    : [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
)

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use(helmet())
app.use(requestLogger)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true
  })
)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: env.NODE_ENV === 'production' ? 300 : 5000 }))
app.use(express.json())
app.use(cookieParser())

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', apiRouter)
app.use('/api', notFound)
app.use(errorHandler)
