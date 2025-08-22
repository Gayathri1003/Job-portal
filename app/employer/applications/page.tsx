import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, ArrowLeft, Users, MapPin, Clock, Filter } from "lucide-react"
import type { Application } from "@/lib/db"

async function getEmployerApplications(employerId: number) {
  const applications = await sql`
    SELECT 
      a.*,
      j.title as job_title,
      j.location as job_location,
      j.is_remote,
      jsp.name as applicant_name,
      jsp.location as applicant_location,
      jsp.education,
      jsp.resume_url,
      u.email as applicant_email
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.seeker_id = u.id
    LEFT JOIN job_seeker_profiles jsp ON a.seeker_id = jsp.user_id
    WHERE j.employer_id = ${employerId}
    ORDER BY a.application_date DESC
  `

  return applications as (Application & {
    job_title: string
    job_location: string
    is_remote: boolean
    applicant_name: string
    applicant_location: string
    education: string
    resume_url: string
    applicant_email: string
  })[]
}

export default async function EmployerApplicationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  if (!user || user.role !== "employer") {
    redirect("/login")
  }

  const applications = await getEmployerApplications(user.id)

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "applied").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

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
              <Link href="/employer/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
          <p className="text-gray-600">Review and manage applications for your job postings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input placeholder="Search by name or email..." />
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              {applications.length === 0 ? "No applications received yet" : `${applications.length} applications`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Applications will appear here when job seekers apply to your jobs</p>
                <Link href="/employer/jobs/new">
                  <Button>Post Your First Job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-lg">{application.applicant_name || "Anonymous"}</h4>
                          <Badge
                            variant={
                              application.status === "accepted"
                                ? "default"
                                : application.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Applied for:</strong> {application.job_title}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Email:</strong> {application.applicant_email}
                        </p>

                        {application.applicant_location && (
                          <p className="text-sm text-gray-600 mb-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {application.applicant_location}
                          </p>
                        )}

                        {application.education && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Education:</strong> {application.education}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 flex items-center mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {new Date(application.application_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {application.resume_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                              View Resume
                            </a>
                          </Button>
                        )}
                        <Link href={`/employer/jobs/${application.job_id}`}>
                          <Button variant="outline" size="sm">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {application.status === "applied" && (
                      <div className="flex space-x-2 mt-4 pt-4 border-t">
                        <Button size="sm" disabled>
                          Accept Application
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          Reject Application
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
