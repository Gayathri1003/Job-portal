import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { status, notes } = await request.json()
    const applicationId = Number.parseInt(id)

    if (!["accepted", "rejected", "waitlisted"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Verify the application belongs to this employer's job
    const applications = await sql`
      SELECT a.*, j.title as job_title, j.employer_id, u.email as applicant_email, jsp.phone_number
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.seeker_id = u.id
      LEFT JOIN job_seeker_profiles jsp ON a.seeker_id = jsp.user_id
      WHERE a.id = ${applicationId} AND j.employer_id = ${user.id}
    `

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const application = applications[0]

    // Update application status
    await sql`
      UPDATE applications
      SET status = ${status},
          employer_notes = ${notes || null},
          status_updated_at = CURRENT_TIMESTAMP
      WHERE id = ${applicationId}
    `

    // Create notification for the job seeker
    const notificationMessages = {
      accepted: `Great news! Your application for "${application.job_title}" has been accepted.`,
      rejected: `Thank you for your interest. Your application for "${application.job_title}" was not selected this time.`,
      waitlisted: `Your application for "${application.job_title}" has been waitlisted. We'll keep you updated.`,
    }

    await sql`
      INSERT INTO notifications (user_id, title, message, type, related_application_id)
      VALUES (
        ${application.seeker_id},
        ${`Application ${status.charAt(0).toUpperCase() + status.slice(1)}`},
        ${notificationMessages[status as keyof typeof notificationMessages]},
        ${status === "accepted" ? "success" : status === "rejected" ? "error" : "info"},
        ${applicationId}
      )
    `

    return NextResponse.json({
      message: `Application ${status} successfully`,
      applicant_email: application.applicant_email,
      applicant_phone: application.phone_number,
    })
  } catch (error) {
    console.error("Update application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
