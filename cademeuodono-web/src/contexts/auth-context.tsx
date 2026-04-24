'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { authApi, usersApi, ApiError } from '@/lib/api'
import { setStoredToken, clearStoredToken, getStoredToken } from '@/lib/utils'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>
  register: (data: {
    fullName: string
    email: string
    password: string
    phonePrimary?: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restaura sessão do localStorage na inicialização
  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) {
      setIsLoading(false)
      return
    }

    setToken(stored)
    usersApi
      .getMe(stored)
      .then((u) => setUser(u))
      .catch(() => {
        // Token expirado ou inválido — limpa sessão
        clearStoredToken()
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, session } = await authApi.login({ email, password })
    setStoredToken(session.access_token, session.refresh_token)
    setToken(session.access_token)
    setUser(u)
    router.push('/dashboard')
  }, [router])

  const loginWithToken = useCallback(async (accessToken: string, refreshToken: string) => {
    setStoredToken(accessToken, refreshToken)
    setToken(accessToken)
    const u = await usersApi.getMe(accessToken)
    setUser(u)
    router.push('/dashboard')
  }, [router])

  const register = useCallback(async (data: Parameters<AuthContextValue['register']>[0]) => {
    const { user: u, session } = await authApi.register(data)
    if (session) {
      setStoredToken(session.access_token, session.refresh_token)
      setToken(session.access_token)
      setUser(u)
      router.push('/dashboard')
    } else {
      router.push('/login?registered=1')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const u = await usersApi.getMe(token)
    setUser(u)
  }, [token])

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        // ignora erros de logout no servidor
      }
    }
    clearStoredToken()
    setToken(null)
    setUser(null)
    router.push('/login')
  }, [token, router])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithToken, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export { ApiError }
