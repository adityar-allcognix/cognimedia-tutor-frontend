import { getAuthSession } from "./auth"

export function getCurrentUserId(): string | null {
  return getAuthSession()?.user.id ?? null
}

export function getUser() {
  const session = getAuthSession()
  return session?.user ?? null
}
