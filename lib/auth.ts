import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { User } from "./db"

// Add a more explicit check for JWT_SECRET at the top of the file
const JWT_SECRET_STRING = process.env.JWT_SECRET
if (!JWT_SECRET_STRING || JWT_SECRET_STRING === "your-secret-key") {
  console.error(
    "CRITICAL ERROR: JWT_SECRET environment variable is not set or is using the default value. Please set a strong, unique secret in your Vercel project settings.",
  )
  // In a real application, you might want to throw an error here to prevent startup
  // throw new Error("JWT_SECRET environment variable is not set.");
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || "your-secret-key") // Fallback for local dev if not set

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: { userId: number; email: string; role: string }): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: number; email: string; role: string }
  } catch (e) {
    console.error("JWT verification failed:", e) // Log the actual error from jose
    return null
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token)
  if (!payload) return null

  const users = await sql`
    SELECT * FROM users WHERE id = ${payload.userId}
  `
  return (users[0] as User) || null
}
