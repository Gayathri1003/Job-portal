import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profiles = await sql`
      SELECT * FROM employer_profiles WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      profile: profiles[0] || null,
    })
  } catch (error) {
    console.error("Get employer profile error:", error)
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
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { company_name, website, location, industry, description } = await request.json()

    // Validate required fields
    if (!company_name || !company_name.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    if (!location || !location.trim()) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    if (!industry || !industry.trim()) {
      return NextResponse.json({ error: "Industry is required" }, { status: 400 })
    }

    // Check if profile exists
    const existingProfiles = await sql`
      SELECT id FROM employer_profiles WHERE user_id = ${user.id}
    `

    if (existingProfiles.length > 0) {
      // Update existing profile
      await sql`
        UPDATE employer_profiles 
        SET company_name = ${company_name.trim()},
            website = ${website?.trim() || null},
            location = ${location.trim()},
            industry = ${industry.trim()},
            description = ${description?.trim() || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}
      `
    } else {
      // Create new profile
      await sql`
        INSERT INTO employer_profiles (user_id, company_name, website, location, industry, description)
        VALUES (${user.id}, ${company_name.trim()}, ${website?.trim() || null}, ${location.trim()}, ${industry.trim()}, ${description?.trim() || null})
      `
    }

    return NextResponse.json({ message: "Profile saved successfully" })
  } catch (error) {
    console.error("Save employer profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
