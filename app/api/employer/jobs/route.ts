import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

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

    const { title, description, experience_required, salary, location, country, is_remote, job_type, domain } =
      await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Job title and description are required" }, { status: 400 })
    }

    await sql`
      INSERT INTO jobs (
        employer_id, 
        title, 
        description, 
        experience_required, 
        salary, 
        location, 
        country, 
        is_remote, 
        job_type, 
        domain
      )
      VALUES (
        ${user.id}, 
        ${title}, 
        ${description}, 
        ${experience_required || null}, 
        ${salary || null}, 
        ${location || null}, 
        ${country || null}, 
        ${is_remote}, 
        ${job_type || null}, 
        ${domain || null}
      )
    `

    return NextResponse.json({ message: "Job posted successfully" })
  } catch (error) {
    console.error("Post job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
