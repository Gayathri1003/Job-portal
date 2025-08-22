import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, Plus, Settings, Users, Building, FileText } from "lucide-react"
import type { Job, EmployerProfile } from "@/lib/db"

async function getEmployerData(userId: number) {
  // Get profile
  const profiles = await sql`
    SELECT * FROM employer_profiles WHERE user_id = ${userId}
  `

  // Get jobs
  const jobs = await sql`
    SELECT j.*, COUNT(a.id) as application_count
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.employer_id = ${userId}
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
    WHERE j.employer_id = ${userId}
  `

  return {
    profile: (profiles[0] as EmployerProfile) || null,
    jobs: jobs as (Job & { application_count: number })[],
    stats,
  }
}

export default async function EmployerDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  console.log("Employer Dashboard: Token from cookies:", token ? "Present" : "Not Present")
  console.log(
    "Employer Dashboard (Server): Raw auth-token from cookies:",
    token ? token.substring(0, 20) + "..." : "Not Present",
  )

  if (!token) {
    console.log("Employer Dashboard: No token found, redirecting to login.")
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  console.log("Employer Dashboard: User from token:", user ? user.email : "None")
  console.log(
    "Employer Dashboard (Server): User from token:",
    user ? `ID: ${user.id}, Email: ${user.email}, Role: ${user.role}` : "None",
  )

  if (!user) {
    console.log("Employer Dashboard (Server): User object is null, redirecting to login.")
    redirect("/login")
  }
  if (user.role !== "employer") {
    console.log(`Employer Dashboard (Server): User role is '${user.role}', not 'employer', redirecting to login.`)
    redirect("/login")
  }

  const { profile, jobs, stats } = await getEmployerData(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Sarkar Daily Jobs</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/jobs">
                <Button variant="ghost">Browse Jobs</Button>
              </Link>
              <Link href="/employer/profile">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.company_name ? `, ${profile.company_name}` : ""}!
          </h1>
          <p className="text-gray-600">Manage your job postings and find the best talent</p>
        </div>

        {/* Profile Setup Alert */}
        {!profile && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Complete Your Company Profile</CardTitle>
              <CardDescription className="text-orange-700">
                Set up your company profile to start posting jobs and attract top talent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/employer/profile">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_applications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_applications}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Job Postings</CardTitle>
                  <Link href="/employer/jobs/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Post Job
                    </Button>
                  </Link>
                </div>
                <CardDescription>Manage your job listings and view applications</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-600 mb-4">Start by posting your first job to attract talent</p>
                    <Link href="/employer/jobs/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Job
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{job.title}</h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <span>{job.is_remote ? "Remote" : job.location}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(job.posted_at).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <span>{job.application_count} applications</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={job.is_open ? "default" : "secondary"}>
                            {job.is_open ? "Active" : "Closed"}
                          </Badge>
                          <Link href={`/employer/jobs/${job.id}`}>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/employer/jobs/new">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                </Link>
                <Link href="/employer/profile">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/employer/applications">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Company Summary */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">{profile.company_name}</h4>
                    {profile.location && <p className="text-sm text-gray-600">{profile.location}</p>}
                  </div>
                  {profile.industry && (
                    <div>
                      <h5 className="text-sm font-medium">Industry</h5>
                      <p className="text-sm text-gray-600">{profile.industry}</p>
                    </div>
                  )}
                  {profile.website && (
                    <div>
                      <h5 className="text-sm font-medium">Website</h5>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
