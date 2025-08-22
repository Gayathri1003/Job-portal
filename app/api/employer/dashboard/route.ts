import { NextResponse } from "next/server"
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

    // Get profile
    const profiles = await sql`
      SELECT * FROM employer_profiles WHERE user_id = ${user.id}
    `

    // Get jobs
    const jobs = await sql`
      SELECT j.*, COUNT(a.id) as application_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.employer_id = ${user.id}
      GROUP BY j.id
      ORDER BY j.posted_at DESC
      LIMIT 10
    `

    // Get stats
    const [stats] = await sql`
      SELECT 
        COUNT(j.id) as total_jobs,
        COUNT(CASE WHEN j.is_open = true THEN 1 END) as active_jobs,
        COUNT(a.id) as total_applications,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as pending_applications
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.employer_id = ${user.id}
    `

    return NextResponse.json({
      profile: profiles[0] || null,
      jobs,
      stats,
    })
  } catch (error) {
    console.error("Get employer dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
