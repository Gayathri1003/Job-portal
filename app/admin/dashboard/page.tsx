import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, Users, Building, FileText, Shield } from "lucide-react"

async function getAdminStats() {
  const [userStats] = await sql`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'job_seeker' THEN 1 END) as job_seekers,
      COUNT(CASE WHEN role = 'employer' THEN 1 END) as employers,
      COUNT(CASE WHEN is_paid = true THEN 1 END) as paid_users
    FROM users
  `

  const [jobStats] = await sql`
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN is_open = true THEN 1 END) as active_jobs
    FROM jobs
  `

  const [applicationStats] = await sql`
    SELECT COUNT(*) as total_applications
    FROM applications
  `

  return {
    users: userStats,
    jobs: jobStats,
    applications: applicationStats,
  }
}

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  const stats = await getAdminStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Admin Dashboard</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">View Site</Button>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <Button type="submit" variant="ghost">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, jobs, and platform statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.users.paid_users} paid • {stats.users.total_users - stats.users.paid_users} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Seekers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.job_seekers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.employers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.jobs.total_jobs}</div>
              <p className="text-xs text-muted-foreground">{stats.jobs.active_jobs} active</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  View All Users
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Payment Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>Monitor and moderate job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <Briefcase className="h-4 w-4 mr-2" />
                  View All Jobs
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Moderate Content
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Stats</CardTitle>
              <CardDescription>View detailed analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Analytics Dashboard
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <Building className="h-4 w-4 mr-2" />
                  Revenue Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>Admin features are currently in development</p>
        </div>
      </div>
    </div>
  )
}
