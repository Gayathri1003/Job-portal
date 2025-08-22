import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, FileText, MapPin, Clock, Building, Plus, Settings, DollarSign } from "lucide-react"
import type { Application, JobSeekerProfile, Job } from "@/lib/db"

async function getSeekerData(userId: number) {
  // Get profile
  const profiles = await sql`
    SELECT * FROM job_seeker_profiles WHERE user_id = ${userId}
  `

  // Get applications
  const applications = await sql`
    SELECT 
      a.*,
      j.title as job_title,
      j.location,
      j.is_remote,
      j.salary,
      ep.company_name,
      ep.logo_url as company_logo
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE a.seeker_id = ${userId}
    ORDER BY a.application_date DESC
    LIMIT 5
  `

  // Get recent available jobs (not applied to)
  const availableJobs = await sql`
    SELECT 
      j.*,
      ep.company_name,
      ep.logo_url as company_logo
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    LEFT JOIN applications a ON j.id = a.job_id AND a.seeker_id = ${userId}
    WHERE j.is_open = true 
    AND a.id IS NULL
    ORDER BY j.posted_at DESC
    LIMIT 6
  `

  // Get stats
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_applications,
      COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN status = 'applied' THEN 1 END) as pending
    FROM applications 
    WHERE seeker_id = ${userId}
  `

  return {
    profile: (profiles[0] as JobSeekerProfile) || null,
    applications: applications as Application[],
    availableJobs: availableJobs as Job[],
    stats,
  }
}

export default async function SeekerDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  console.log("Seeker Dashboard: Token from cookies:", token ? "Present" : "Not Present")

  if (!token) {
    console.log("Seeker Dashboard: No token found, redirecting to login.")
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  console.log("Seeker Dashboard: User from token:", user ? user.email : "None")

  if (!user || user.role !== "job_seeker") {
    console.log("Seeker Dashboard: User not found or not job_seeker, redirecting to login.")
    redirect("/login")
  }

  const { profile, applications, availableJobs, stats } = await getSeekerData(user.id)

  console.log("Available jobs count:", availableJobs.length)
  console.log("Applications count:", applications.length)

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
              <Link href="/seeker/profile">
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
            Welcome back{profile?.name ? `, ${profile.name}` : ""}!
          </h1>
          <p className="text-gray-600">Track your applications and discover new opportunities</p>
        </div>

        {/* Profile Setup Alert */}
        {!profile && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Complete Your Profile</CardTitle>
              <CardDescription className="text-orange-700">
                Set up your profile to start applying for jobs and get discovered by employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/seeker/profile">
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
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_applications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Jobs</CardTitle>
                  <Link href="/jobs">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <CardDescription>Discover new job opportunities that match your profile</CardDescription>
              </CardHeader>
              <CardContent>
                {availableJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No new jobs available</h3>
                    <p className="text-gray-600 mb-4">Check back later for new opportunities or browse all jobs</p>
                    <Link href="/jobs">
                      <Button>Browse All Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          {job.company_logo && (
                            <img
                              src={job.company_logo || "/placeholder.svg"}
                              alt={job.company_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="h-3 w-3 mr-1" />
                              {job.company_name || "Company"}
                              <span className="mx-2">•</span>
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.is_remote ? "Remote" : job.location || "Location not specified"}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Posted {new Date(job.posted_at).toLocaleDateString()}
                              {job.salary && (
                                <>
                                  <span className="mx-2">•</span>
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  <span className="text-green-600">{job.salary}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.domain && (
                                <Badge variant="secondary" className="text-xs">
                                  {job.domain}
                                </Badge>
                              )}
                              {job.is_remote && (
                                <Badge variant="outline" className="text-xs">
                                  Remote
                                </Badge>
                              )}
                              {job.job_type && (
                                <Badge variant="outline" className="text-xs">
                                  {job.job_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link href={`/jobs/${job.id}`}>
                            <Button size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Applications */}
            {applications.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Applications</CardTitle>
                    <Link href="/seeker/applications">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>Track the status of your recent job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {application.company_logo && (
                            <img
                              src={application.company_logo || "/placeholder.svg"}
                              alt={application.company_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{application.job_title}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="h-3 w-3 mr-1" />
                              {application.company_name}
                              <span className="mx-2">•</span>
                              <MapPin className="h-3 w-3 mr-1" />
                              {application.is_remote ? "Remote" : application.location}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Applied {new Date(application.application_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/jobs">
                  <Button className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse All Jobs
                  </Button>
                </Link>
                <Link href="/seeker/profile">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/seeker/applications">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    My Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">{profile.name}</h4>
                    {profile.location && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                  {profile.education && (
                    <div>
                      <h5 className="text-sm font-medium">Education</h5>
                      <p className="text-sm text-gray-600">{profile.education}</p>
                    </div>
                  )}
                  {profile.job_preferences && (
                    <div>
                      <h5 className="text-sm font-medium">Preferences</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        {profile.job_preferences.domains && profile.job_preferences.domains.length > 0 && (
                          <p>
                            <strong>Domains:</strong> {profile.job_preferences.domains.join(", ")}
                          </p>
                        )}
                        {profile.job_preferences.experience_level && (
                          <p>
                            <strong>Experience:</strong> {profile.job_preferences.experience_level}
                          </p>
                        )}
                        {profile.job_preferences.remote_work && (
                          <p>
                            <strong>Remote:</strong> Open to remote work
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {profile.resume_url && (
                    <div>
                      <h5 className="text-sm font-medium">Resume</h5>
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Resume
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
