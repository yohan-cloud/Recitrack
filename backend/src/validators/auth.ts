import { z } from 'zod'

const strongPassword = z.string()
  .min(10, 'Password must be at least 10 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/\d/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol.')

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: strongPassword
})

export const forgotPasswordSchema = z.object({
  username: z.string().min(3)
})

export const resetPasswordSchema = z.object({
  username: z.string().min(3),
  code: z.string().regex(/^\d{6}$/, 'Reset code must be 6 digits.'),
  newPassword: strongPassword
})
