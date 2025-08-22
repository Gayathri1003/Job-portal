// This file is no longer strictly necessary for the core auth flow
// after removing middleware, but keeping it for potential client-side
// checks if needed in the future.
"use client"

export interface ClientUser {
  id: number
  email: string
  role: "job_seeker" | "employer" | "admin"
  is_paid: boolean
  email_verified: boolean
}

export function getClientUser(): ClientUser | null {
  if (typeof window === "undefined") return null

  try {
    const userStr = localStorage.getItem("user")
    const isAuthenticated = localStorage.getItem("isAuthenticated")

    if (!userStr || !isAuthenticated) return null

    return JSON.parse(userStr) as ClientUser
  } catch {
    return null
  }
}

export function setClientUser(user: ClientUser) {
  if (typeof window === "undefined") return

  localStorage.setItem("user", JSON.stringify(user))
  localStorage.setItem("isAuthenticated", "true")
}

export function clearClientUser() {
  if (typeof window === "undefined") return

  localStorage.removeItem("user")
  localStorage.removeItem("isAuthenticated")
}

export function isClientAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  return localStorage.getItem("isAuthenticated") === "true"
}
