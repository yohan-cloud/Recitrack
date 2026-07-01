import jwt from 'jsonwebtoken'
import type { Secret, SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

export type JwtPayload = {
  userId: string
  username: string
  role: 'TEACHER' | 'STUDENT'
}

const accessSecret: Secret = env.JWT_ACCESS_SECRET
const refreshSecret: Secret = env.JWT_REFRESH_SECRET
const accessOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
const refreshOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, accessSecret, accessOptions)
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, refreshSecret, refreshOptions)
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload
}
