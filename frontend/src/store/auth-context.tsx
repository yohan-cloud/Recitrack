import { createContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { changePasswordRequest, loginRequest, logoutRequest, meRequest, refreshRequest } from '../services/auth'
import type { AuthUser, LoginPayload } from '../types/auth'

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const refreshed = await refreshRequest()
        setAccessToken(refreshed.accessToken)
        const currentUser = await meRequest(refreshed.accessToken)
        setUser(currentUser)
      } catch {
        setUser(null)
        setAccessToken(null)
      } finally {
        setLoading(false)
      }
    }

    void restore()
  }, [])

  const login = async (payload: LoginPayload) => {
    const result = await loginRequest(payload)
    setAccessToken(result.accessToken)
    setUser(result.user)
    return result.user
  }

  const logout = async () => {
    await logoutRequest()
    setUser(null)
    setAccessToken(null)
  }

  const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    if (!accessToken) {
      throw new Error('Authentication required')
    }

    await changePasswordRequest(accessToken, payload)
    const currentUser = await meRequest(accessToken)
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}
