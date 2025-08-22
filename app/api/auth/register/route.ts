import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    console.log("Registration attempt:", { email, role })

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["job_seeker", "employer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)
    console.log("Password hashed successfully")

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, is_paid, email_verified)
      VALUES (${email}, ${passwordHash}, ${role}, true, false)
      RETURNING id, email, role, is_paid
    `

    console.log("User created:", { id: user.id, email: user.email, role: user.role })

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log("Token created successfully")

    // Set cookie
    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_paid: user.is_paid,
      },
    })

    // Determine cookie options based on environment
    const isPreviewOrProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "preview"
    const cookieOptions = {
      httpOnly: true,
      secure: isPreviewOrProduction,
      sameSite: "lax" as const, // Changed from conditional "none" or "lax"
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    response.cookies.set("auth-token", token, cookieOptions)

    console.log("Cookie set successfully with options:", cookieOptions)

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
