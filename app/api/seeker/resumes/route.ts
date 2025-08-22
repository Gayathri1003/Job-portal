import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { put } from "@vercel/blob"

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

    const resumes = await sql`
      SELECT id, title, file_url, file_name, is_default, created_at
      FROM resumes
      WHERE user_id = ${user.id}
      ORDER BY is_default DESC, created_at DESC
    `

    return NextResponse.json({ resumes })
  } catch (error) {
    console.error("Error fetching resumes:", error)
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

    const formData = await request.formData()
    const resumeFile = formData.get("resume") as File | null
    const title = formData.get("title") as string | null

    if (!resumeFile) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 })
    }

    if (resumeFile.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const filename = `${user.id}-${Date.now()}-${resumeFile.name}`
    const blob = await put(filename, resumeFile, {
      access: "public",
      addRandomSuffix: false,
    })

    // Check if this is the first resume, if so, make it default
    const existingResumes = await sql`
      SELECT COUNT(*) FROM resumes WHERE user_id = ${user.id}
    `
    const isDefault = (existingResumes[0].count as number) === 0

    await sql`
      INSERT INTO resumes (user_id, title, file_url, file_name, is_default)
      VALUES (${user.id}, ${title || resumeFile.name.replace(".pdf", "")}, ${blob.url}, ${resumeFile.name}, ${isDefault})
    `

    return NextResponse.json({ message: "Resume uploaded successfully", url: blob.url })
  } catch (error) {
    console.error("Error uploading resume:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
