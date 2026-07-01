import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  REFRESH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  REFRESH_COOKIE_SECURE: z.coerce.boolean().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(1).optional()
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') {
    return
  }

  const unsafeSecrets = new Set(['change-me-access-secret', 'change-me-refresh-secret'])
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (value[key].length < 32 || unsafeSecrets.has(value[key])) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} must be a unique random string with at least 32 characters in production.`
      })
    }
  }

  if (value.REFRESH_COOKIE_SAME_SITE === 'none' && value.REFRESH_COOKIE_SECURE === false) {
    ctx.addIssue({
      code: 'custom',
      path: ['REFRESH_COOKIE_SECURE'],
      message: 'REFRESH_COOKIE_SECURE must be true when REFRESH_COOKIE_SAME_SITE is none.'
    })
  }

  if (!value.SMTP_HOST || !value.SMTP_PORT || !value.SMTP_USER || !value.SMTP_PASS || !value.SMTP_FROM) {
    ctx.addIssue({
      code: 'custom',
      path: ['SMTP_HOST'],
      message: 'SMTP settings are required in production for password reset emails.'
    })
  }
})

export const env = envSchema.parse(process.env)
