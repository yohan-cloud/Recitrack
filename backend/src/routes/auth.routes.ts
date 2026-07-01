import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { changePassword, forgotPassword, login, logout, me, refresh, resetPassword } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from '../validators/auth.js'

export const authRouter = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
})

authRouter.post('/login', loginLimiter, validate(loginSchema), login)
authRouter.post('/forgot-password', loginLimiter, validate(forgotPasswordSchema), forgotPassword)
authRouter.post('/reset-password', loginLimiter, validate(resetPasswordSchema), resetPassword)
authRouter.post('/logout', logout)
authRouter.post('/refresh', refresh)
authRouter.get('/me', authenticate, me)
authRouter.post('/change-password', authenticate, validate(changePasswordSchema), changePassword)
