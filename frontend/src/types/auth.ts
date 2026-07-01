export type UserRole = 'TEACHER' | 'STUDENT'

export type AuthUser = {
  id: string
  username: string
  role: UserRole
  isFirstLogin: boolean
  profile: Record<string, unknown> | null
}

export type LoginPayload = {
  username: string
  password: string
}
