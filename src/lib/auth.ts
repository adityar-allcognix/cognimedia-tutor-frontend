export type AuthUser = {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export type AuthSession = {
  access_token: string
  token_type: string
  user: AuthUser
}

const AUTH_STORAGE_KEY = "cbse_tutor_auth"

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return getAuthSession()?.access_token ?? null
}
