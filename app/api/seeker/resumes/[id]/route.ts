import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get resume details to delete from blob storage
    const resumes = await sql`
      SELECT file_url, is_default FROM resumes WHERE id = ${resumeId} AND user_id = ${user.id}
    `

    if (resumes.length === 0) {
      return NextResponse.json({ error: "Resume not found or unauthorized" }, { status: 404 })
    }

    const resumeToDelete = resumes[0]

    // Prevent deleting the default resume if it's the only one
    if (resumeToDelete.is_default) {
      const otherResumes = await sql`
        SELECT COUNT(*) FROM resumes WHERE user_id = ${user.id} AND id != ${resumeId}
      `
      if (Number(otherResumes[0].count) === 0) {
        return NextResponse.json({ error: "Cannot delete the only default resume. Please upload another or set a new default first." }, { status: 400 })
      }
    }

    // Delete from Vercel Blob storage
    await del(resumeToDelete.file_url)

    // Delete from database
    await sql`
      DELETE FROM resumes WHERE id = ${resumeId} AND user_id = ${user.id}
    `

    // If the deleted resume was default, set a new default if others exist
    if (resumeToDelete.is_default) {
      const remainingResumes = await sql`
        SELECT id FROM resumes WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
      `
      if (remainingResumes.length > 0) {
        await sql`
          UPDATE resumes SET is_default = TRUE WHERE id = ${remainingResumes[0].id}
        `
      }
    }

    return NextResponse.json({ message: "Resume deleted successfully" })
  } catch (error) {
    console.error("Error deleting resume:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
