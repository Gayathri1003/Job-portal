import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("Login attempt for:", email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const users = await sql`
      SELECT id, email, password_hash, role, is_paid, email_verified
      FROM users 
      WHERE email = ${email}
    `

    console.log("Users found:", users.length)

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("User found:", { id: user.id, email: user.email, role: user.role })

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    console.log("Password valid:", isValidPassword)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log("Token created successfully")

    // Create response
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_paid: user.is_paid,
        email_verified: user.email_verified,
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

    // Set cookie with proper settings for preview environments
    response.cookies.set("auth-token", token, cookieOptions)

    console.log("Cookie set successfully with options:", cookieOptions)

    // Redirect based on user role
    if (user.role === "job_seeker") {
      console.log("🎯 Navigating to seeker dashboard")
      // Assuming router is available in the context where this function is called
      // router.push("/seeker/dashboard")
    }

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
