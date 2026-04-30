import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import apiClient from '../api/axios'

export interface AuthUser {
  id: number
  name: string
  username: string
  is_admin: boolean
  permissions: string[] | null
}

interface AuthContextType {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  hasPermission: (path: string) => boolean
  isLoadingUser: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  hasPermission: () => true,
  isLoadingUser: false,
})

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(loadStoredUser)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  const setUser = (u: AuthUser | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
    } else {
      localStorage.removeItem('user')
    }
  }

  // If we have a token but no user, fetch from /me
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setUser(null); return }
    if (user) return

    setIsLoadingUser(true)
    apiClient.get('/me')
      .then(({ data }) => setUser(data as AuthUser))
      .catch(() => {})
      .finally(() => setIsLoadingUser(false))
  }, [])

  // Keep user in sync when auth changes (login/logout from another tab)
  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setUserState(null)
        localStorage.removeItem('user')
      } else {
        const stored = loadStoredUser()
        if (stored) setUserState(stored)
      }
    }
    window.addEventListener('auth-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('auth-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const hasPermission = (path: string): boolean => {
    if (!user) return false
    if (user.is_admin) return true
    const perms = user.permissions ?? []
    return perms.includes(path)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, hasPermission, isLoadingUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
