import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'sql_analytics_token'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  /** Exchange credentials for a token; throws on failure. */
  login: (username: string, password: string) => Promise<void>
  /** Clear the stored token (also called on a 401 from a protected call). */
  logout: () => void
  /** Authorization header for protected requests ({} when logged out). */
  authHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  )

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? 'Invalid username or password'
          : `Login failed (HTTP ${res.status})`
      )
    }
    const data = (await res.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const authHeaders = useCallback(
    (): Record<string, string> =>
      token ? { Authorization: `Bearer ${token}` } : {},
    [token]
  )

  const value = useMemo<AuthState>(
    () => ({ token, isAuthenticated: !!token, login, logout, authHeaders }),
    [token, login, logout, authHeaders]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
