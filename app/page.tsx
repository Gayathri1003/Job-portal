import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Building, Users, Briefcase, TrendingUp } from "lucide-react"
import { sql } from "@/lib/db"
import type { Job } from "@/lib/db"

async function getStats() {
  const [jobsCount] = await sql`SELECT COUNT(*) as count FROM jobs WHERE is_open = true`
  const [companiesCount] = await sql`SELECT COUNT(DISTINCT employer_id) as count FROM jobs WHERE is_open = true`
  const [applicationsCount] = await sql`SELECT COUNT(*) as count FROM applications`

  return {
    jobs: Number(jobsCount.count) || 0,
    companies: Number(companiesCount.count) || 0,
    applications: Number(applicationsCount.count) || 0,
  }
}

async function getRecentJobs(): Promise<Job[]> {
  const jobs = await sql`
    SELECT j.*, ep.company_name, ep.logo_url as company_logo
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE j.is_open = true
    ORDER BY j.posted_at DESC
    LIMIT 6
  `
  return jobs as Job[]
}

export default async function HomePage() {
  const stats = await getStats()
  const recentJobs = await getRecentJobs()

  console.log("Home page stats:", stats)
  console.log("Recent jobs count:", recentJobs.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Sarkar Daily Jobs</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/jobs">
                <Button variant="ghost">Browse Jobs</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Find Your Dream Job Today</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with top employers worldwide. Whether you're looking for remote work or on-site opportunities, we
            have thousands of jobs waiting for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=job_seeker">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="mr-2 h-5 w-5" />
                I'm Looking for Jobs
              </Button>
            </Link>
            <Link href="/register?role=employer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Building className="mr-2 h-5 w-5" />
                I'm Hiring Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.jobs.toLocaleString()}+</h3>
              <p className="text-gray-600">Active Jobs</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.companies.toLocaleString()}+</h3>
              <p className="text-gray-600">Companies Hiring</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.applications.toLocaleString()}+</h3>
              <p className="text-gray-600">Applications Sent</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Latest Job Opportunities</h3>
            <p className="text-gray-600">Discover the newest job postings from top companies</p>
          </div>

          {recentJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recentJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                          <CardDescription className="flex items-center text-sm">
                            <Building className="h-4 w-4 mr-1" />
                            {job.company_name || "Company"}
                          </CardDescription>
                        </div>
                        {job.company_logo && (
                          <img
                            src={job.company_logo || "/placeholder.svg"}
                            alt={job.company_name || "Company"}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.is_remote ? "Remote" : job.location || "Location not specified"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(job.posted_at).toLocaleDateString()}
                        </div>
                        {job.salary && <div className="text-sm text-green-600">{job.salary}</div>}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
                        {job.is_remote && <Badge variant="outline">Remote</Badge>}
                        {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>

                      <Link href={`/jobs/${job.id}`}>
                        <Button className="w-full">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Link href="/jobs">
                  <Button size="lg" variant="outline">
                    View All Jobs
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-600 mb-4">Be the first employer to post a job opportunity!</p>
              <Link href="/register?role=employer">
                <Button>Post Your First Job</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Briefcase className="h-6 w-6 mr-2" />
                <span className="text-lg font-bold">Sarkar Daily Jobs</span>
              </div>
              <p className="text-gray-400">
                Connecting talent with opportunities worldwide. Find your next career move today.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/jobs" className="hover:text-white">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/register?role=job_seeker" className="hover:text-white">
                    Create Profile
                  </Link>
                </li>
                <li>
                  <Link href="/seeker/applications" className="hover:text-white">
                    My Applications
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register?role=employer" className="hover:text-white">
                    Post Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/employer/dashboard" className="hover:text-white">
                    Manage Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/employer/applications" className="hover:text-white">
                    View Applicants
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sarkar Daily Jobs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
