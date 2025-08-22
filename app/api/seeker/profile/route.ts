import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profiles = await sql`
      SELECT id, user_id, name, location, education, phone_number, job_preferences, created_at, updated_at
      FROM job_seeker_profiles
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({ profile: profiles.length > 0 ? profiles[0] : null })
  } catch (error) {
    console.error("Error fetching job seeker profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, location, education, phone_number, job_preferences } = await request.json()

    if (!name || !location || !education) {
      return NextResponse.json({ error: "Name, location, and education are required" }, { status: 400 })
    }

    const existingProfile = await sql`
      SELECT id FROM job_seeker_profiles WHERE user_id = ${user.id}
    `

    if (existingProfile.length > 0) {
      // Update existing profile
      await sql`
        UPDATE job_seeker_profiles
        SET name = ${name},
            location = ${location},
            education = ${education},
            phone_number = ${phone_number || null},
            job_preferences = ${job_preferences || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}
      `
    } else {
      // Create new profile
      await sql`
        INSERT INTO job_seeker_profiles (user_id, name, location, education, phone_number, job_preferences)
        VALUES (${user.id}, ${name}, ${location}, ${education}, ${phone_number || null}, ${job_preferences || null})
      `
    }

    return NextResponse.json({ message: "Profile saved successfully" })
  } catch (error) {
    console.error("Error saving job seeker profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
