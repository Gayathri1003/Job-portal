import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resumeId = Number.parseInt(id)

    // Verify the resume belongs to the user
    const resumes = await sql`
      SELECT id FROM resumes WHERE id = ${resumeId} AND user_id = ${user.id}
    `

    if (resumes.length === 0) {
      return NextResponse.json({ error: "Resume not found or unauthorized" }, { status: 404 })
    }

    // Set all other resumes for this user to not default
    await sql`
      UPDATE resumes SET is_default = FALSE WHERE user_id = ${user.id}
    `

    // Set the selected resume as default
    await sql`
      UPDATE resumes SET is_default = TRUE WHERE id = ${resumeId}
    `

    return NextResponse.json({ message: "Default resume updated successfully" })
  } catch (error) {
    console.error("Error setting default resume:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
