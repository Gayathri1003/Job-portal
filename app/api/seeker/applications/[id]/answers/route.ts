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

    const questionId = Number.parseInt(id)
    const { answerText } = await request.json()

    if (!answerText || answerText.trim() === "") {
      return NextResponse.json({ error: "Answer text cannot be empty" }, { status: 400 })
    }

    // Verify the question belongs to an application of this seeker
    const questions = await sql`
      SELECT eq.application_id, eq.employer_id, j.title as job_title
      FROM employer_questions eq
      JOIN applications a ON eq.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      WHERE eq.id = ${questionId} AND a.seeker_id = ${user.id}
    `

    if (questions.length === 0) {
      return NextResponse.json({ error: "Question not found or unauthorized" }, { status: 404 })
    }

    const question = questions[0]

    // Check if an answer already exists for this question
    const existingAnswer = await sql`
      SELECT id FROM seeker_answers WHERE question_id = ${questionId} AND seeker_id = ${user.id}
    `
    if (existingAnswer.length > 0) {
      return NextResponse.json({ error: "You have already answered this question." }, { status: 400 })
    }

    await sql`
      INSERT INTO seeker_answers (question_id, seeker_id, answer_text)
      VALUES (${questionId}, ${user.id}, ${answerText})
    `

    // Create notification for the employer
    await sql`
      INSERT INTO notifications (user_id, title, message, type, related_application_id)
      VALUES (
        ${question.employer_id},
        ${"New Answer from Applicant"},
        ${`An applicant for "${question.job_title}" has answered your question. `},
        ${"info"},
        ${question.application_id}
      )
    `

    return NextResponse.json({ message: "Answer submitted successfully" })
  } catch (error) {
    console.error("Error submitting answer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
