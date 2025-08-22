import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, Building, DollarSign, Users, ArrowLeft, CheckCircle } from "lucide-react"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import type { Job, EmployerProfile } from "@/lib/db"
import { ApplyButton } from "./apply-button"

async function getJob(id: string): Promise<(Job & { employer: EmployerProfile }) | null> {
  const jobs = await sql`
    SELECT 
      j.*,
      ep.company_name,
      ep.website,
      ep.logo_url as company_logo,
      ep.location as company_location,
      ep.industry,
      ep.description as company_description
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE j.id = ${Number.parseInt(id)} AND j.is_open = true
  `

  if (jobs.length === 0) return null

  const job = jobs[0]
  return {
    ...job,
    employer: {
      id: 0,
      user_id: job.employer_id,
      company_name: job.company_name,
      website: job.website,
      logo_url: job.company_logo,
      location: job.company_location,
      industry: job.industry,
      description: job.company_description,
      created_at: "",
      updated_at: "",
    },
  } as Job & { employer: EmployerProfile }
}

async function checkApplicationStatus(jobId: number, userId: number | null) {
  if (!userId) return null

  const applications = await sql`
    SELECT status FROM applications 
    WHERE job_id = ${jobId} AND seeker_id = ${userId}
  `

  return applications[0]?.status || null
}

async function checkUserProfile(userId: number | null) {
  if (!userId) return false

  const profiles = await sql`
    SELECT id FROM job_seeker_profiles WHERE user_id = ${userId}
  `

  return profiles.length > 0
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  // Check if user is logged in
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  let user = null
  let applicationStatus = null
  let hasProfile = false

  if (token) {
    try {
      user = await getUserFromToken(token)
      if (user && user.role === "job_seeker") {
        applicationStatus = await checkApplicationStatus(job.id, user.id)
        hasProfile = await checkUserProfile(user.id)
      }
    } catch (error) {
      console.error("Error checking user status:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Sarkar Daily Jobs</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/jobs">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
              </Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href={user.role === "job_seeker" ? "/seeker/dashboard" : "/employer/dashboard"}>
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <Button type="submit" variant="ghost">
                      Logout
                    </Button>
                  </form>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="flex items-center text-lg">
                      <Building className="h-5 w-5 mr-2" />
                      {job.employer.company_name}
                    </CardDescription>
                  </div>
                  {job.employer.logo_url && (
                    <img
                      src={job.employer.logo_url || "/placeholder.svg"}
                      alt={job.employer.company_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.is_remote ? "Remote" : job.location}
                    {job.country && ` • ${job.country}`}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Posted {new Date(job.posted_at).toLocaleDateString()}
                  </div>
                  {job.salary && (
                    <div className="flex items-center font-medium text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
                  {job.is_remote && <Badge variant="outline">Remote</Badge>}
                  {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
                  {job.experience_required && <Badge variant="outline">{job.experience_required}</Badge>}
                </div>
              </CardHeader>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.employer.company_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.employer.description && <p className="text-gray-700">{job.employer.description}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {job.employer.industry && (
                      <div>
                        <span className="font-medium">Industry:</span>
                        <span className="ml-2 text-gray-600">{job.employer.industry}</span>
                      </div>
                    )}
                    {job.employer.location && (
                      <div>
                        <span className="font-medium">Location:</span>
                        <span className="ml-2 text-gray-600">{job.employer.location}</span>
                      </div>
                    )}
                    {job.employer.website && (
                      <div>
                        <span className="font-medium">Website:</span>
                        <a
                          href={job.employer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          {job.employer.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
                <CardDescription>
                  {applicationStatus
                    ? "Application Status"
                    : user && user.role === "job_seeker"
                      ? "Apply for this position"
                      : "Join thousands of job seekers and apply today"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {applicationStatus ? (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Application Submitted</p>
                      <p className="text-sm text-green-600">Status: {applicationStatus}</p>
                    </div>
                  </div>
                ) : user && user.role === "job_seeker" ? (
                  <ApplyButton jobId={job.id} hasProfile={hasProfile} />
                ) : user && user.role === "employer" ? (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">You are logged in as an employer</p>
                  </div>
                ) : (
                  <>
                    <Link href="/register?role=job_seeker">
                      <Button className="w-full" size="lg">
                        <Users className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-600 text-center">* Free account required</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Employment Type</h4>
                  <p className="text-sm text-gray-600">{job.job_type || "Not specified"}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Experience Required</h4>
                  <p className="text-sm text-gray-600">{job.experience_required || "Not specified"}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Work Location</h4>
                  <p className="text-sm text-gray-600">
                    {job.is_remote ? "Remote work available" : `On-site in ${job.location}`}
                  </p>
                </div>

                {job.salary && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Salary Range</h4>
                      <p className="text-sm text-gray-600">{job.salary}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Share Job */}
            <Card>
              <CardHeader>
                <CardTitle>Share this Job</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
