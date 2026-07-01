import { api } from './api'
import type { AuthUser, LoginPayload } from '../types/auth'

export async function loginRequest(payload: LoginPayload) {
  const response = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', payload)
  return response.data
}

export async function meRequest(token: string) {
  const response = await api.get<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function refreshRequest() {
  const response = await api.post<{ accessToken: string }>('/auth/refresh')
  return response.data
}

export async function logoutRequest() {
  await api.post('/auth/logout')
}

export async function changePasswordRequest(accessToken: string, payload: { currentPassword: string; newPassword: string }) {
  await api.post('/auth/change-password', payload, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

export async function forgotPasswordRequest(payload: { username: string }) {
  const response = await api.post<{ message: string }>('/auth/forgot-password', payload)
  return response.data
}

export async function resetPasswordRequest(payload: { username: string; code: string; newPassword: string }) {
  await api.post('/auth/reset-password', payload)
}
