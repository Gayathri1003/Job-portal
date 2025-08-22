import { NextResponse } from "next/server"

export async function POST() {
  // Determine cookie options based on environment
  const isPreviewOrProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_URL
  const cookieOptions = {
    httpOnly: true,
    secure: isPreviewOrProduction,
    sameSite: "lax" as const,
    maxAge: 0, // Expire immediately
    path: "/",
  }

  // Clear the cookie and redirect to logout page
  const response = NextResponse.redirect(new URL("/logout", process.env.VERCEL_URL || "http://localhost:3000"))
  response.cookies.set("auth-token", "", cookieOptions)

  console.log("Logout cookie cleared with options:", cookieOptions)

  return response
}
