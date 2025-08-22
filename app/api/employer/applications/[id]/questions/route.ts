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
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applicationId = Number.parseInt(id)
    const { questionText } = await request.json()

    if (!questionText || questionText.trim() === "") {
      return NextResponse.json({ error: "Question text cannot be empty" }, { status: 400 })
    }

    // Verify the application belongs to this employer's job
    const applications = await sql`
      SELECT a.seeker_id, j.title as job_title, j.employer_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ${applicationId} AND j.employer_id = ${user.id}
    `

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 })
    }

    const application = applications[0]

    await sql`
      INSERT INTO employer_questions (application_id, employer_id, question_text)
      VALUES (${applicationId}, ${user.id}, ${questionText})
    `

    // Create notification for the job seeker
    await sql`
      INSERT INTO notifications (user_id, title, message, type, related_application_id)
      VALUES (
        ${application.seeker_id},
        ${"New Question from Employer"},
        ${`The employer for "${application.job_title}" has asked you a new question. Please check your applications. `},
        ${"info"},
        ${applicationId}
      )
    `

    return NextResponse.json({ message: "Question asked successfully" })
  } catch (error) {
    console.error("Error asking question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
