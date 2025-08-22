import { cookies } from "next/headers"
import Link from "next/link"
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import type { Job } from "@/lib/db"

interface JobsPageProps {
  searchParams: {
    q?: string
    location?: string
    remote?: string
    type?: string
    domain?: string
    min_salary?: string
    page?: string
  }
}

async function getJobs(searchParams: JobsPageProps["searchParams"]) {
  const { q, location, remote, type, domain, min_salary, page } = searchParams
  const currentPage = Number.parseInt(page || "1")
  const limit = 10
  const offset = (currentPage - 1) * limit

  let query = `
    SELECT j.*, ep.company_name, ep.logo_url as company_logo
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE j.is_open = TRUE
  `
  const queryParams: (string | number)[] = []

  if (q) {
    query += ` AND (j.title ILIKE $${queryParams.length + 1} OR j.description ILIKE $${queryParams.length + 2} OR ep.company_name ILIKE $${queryParams.length + 3})`
    queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (location) {
    query += ` AND j.location ILIKE $${queryParams.length + 1}`
    queryParams.push(`%${location}%`)
  }
  if (remote === "true") {
    query += ` AND j.is_remote = TRUE`
  }
  if (type) {
    query += ` AND j.job_type ILIKE $${queryParams.length + 1}`
    queryParams.push(`%${type}%`)
  }
  if (domain) {
    query += ` AND j.domain ILIKE $${queryParams.length + 1}`
    queryParams.push(`%${domain}%`)
  }
  if (min_salary) {
    // This is a simplified salary filter. In a real app, you'd parse salary ranges.
    query += ` AND j.salary IS NOT NULL AND j.salary != '' AND CAST(regexp_replace(j.salary, '[^0-9.]', '', 'g') AS NUMERIC) >= $${queryParams.length + 1}`
    queryParams.push(Number.parseInt(min_salary))
  }

  query += ` ORDER BY j.posted_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
  queryParams.push(limit, offset)

  const jobs = await sql.query(query, queryParams)

  const countQuery = `
    SELECT COUNT(*)
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE j.is_open = TRUE
    ${q ? ` AND (j.title ILIKE $${queryParams.length + 1} OR j.description ILIKE $${queryParams.length + 2} OR ep.company_name ILIKE $${queryParams.length + 3})` : ''}
    ${location ? ` AND j.location ILIKE $${queryParams.length + (q ? 4 : 1)}` : ''}
    ${remote === "true" ? ` AND j.is_remote = TRUE` : ''}
    ${type ? ` AND j.job_type ILIKE $${queryParams.length + (q || location ? 5 : 1)}` : ''}
    ${domain ? ` AND j.domain ILIKE $${queryParams.length + (q || location || type ? 6 : 1)}` : ''}
    ${min_salary ? ` AND j.salary IS NOT NULL AND j.salary != '' AND CAST(regexp_replace(j.salary, '[^0-9.]', '', 'g') AS NUMERIC) >= $${queryParams.length + (q || location || type || domain ? 7 : 1)}` : ''}
  `
  const countQueryParams: (string | number)[] = []
  if (q) {
    countQueryParams.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (location) {
    countQueryParams.push(`%${location}%`)
  }
  if (type) {
    countQueryParams.push(`%${type}%`)
  }
  if (domain) {
    countQueryParams.push(`%${domain}%`)
  }
  if (min_salary) {
    countQueryParams.push(Number.parseInt(min_salary))
  }

  const totalJobsResult = await sql.query(countQuery, countQueryParams)
  const totalJobs = Number(totalJobsResult[0].count)
  const totalPages = Math.ceil(totalJobs / limit)

  return {
    jobs: jobs as Job[],
    totalJobs,
    totalPages,
    currentPage,
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  const user = token ? await getUserFromToken(token) : null

  const { jobs, totalPages, currentPage } = await getJobs(searchParams)

  const currentQuery = new URLSearchParams(searchParams as Record<string, string>)

  const createPageLink = (page: number) => {
    const params = new URLSearchParams(currentQuery)
    params.set("page", page.toString())
    return `/jobs?${params.toString()}`
  }

  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"]
  const domains = ["Software Development", "Data Science", "Marketing", "Sales", "Finance", "HR", "Design", "Customer Service"]

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
              {user ? (
                <>
                  {user.role === "job_seeker" && (
                    <Link href="/seeker/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                  )}
                  {user.role === "employer" && (
                    <Link href="/employer/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                  )}
                  <form action="/api/auth/logout" method="POST">
                    <Button type="submit" variant="ghost">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Dream Job</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="q">Keywords</Label>
                    <div className="relative">
                      <Input
                        id="q"
                        name="q"
                        placeholder="Job title, company, keywords"
                        defaultValue={searchParams.q}
                        className="pl-8"
                      />
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <Input
                        id="location"
                        name="location"
                        placeholder="City, Country"
                        defaultValue={searchParams.location}
                        className="pl-8"
                      />
                      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type</Label>
                    <Select name="type" defaultValue={searchParams.type}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Select name="domain" defaultValue={searchParams.domain}>
                      <SelectTrigger id="domain">
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Domains</SelectItem>
                        {domains.map((domain) => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_salary">Minimum Salary</Label>
                    <div className="relative">
                      <Input
                        id="min_salary"
                        name="min_salary"
                        type="number"
                        placeholder="e.g., 50000"
                        defaultValue={searchParams.min_salary}
                        className="pl-8"
                      />
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote"
                      name="remote"
                      checked={searchParams.remote === "true"}
                      onCheckedChange={(checked) => {
                        const params = new URLSearchParams(window.location.search)
                        if (checked) {
                          params.set("remote", "true")
                        } else {
                          params.delete("remote")
                        }
                        window.history.replaceState(null, "", `?${params.toString()}`)
                      }}
                    />
                    <Label htmlFor="remote">Remote Jobs Only</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                    <Link href="/jobs">
                      <Button variant="outline" className="w-full">
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="md:col-span-3 space-y-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-700">No jobs found matching your criteria.</h2>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {job.company_logo ? (
                          <img
                            src={job.company_logo || "/placeholder.svg"}
                            alt={`${job.company_name} logo`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                            {job.company_name ? job.company_name[0] : "C"}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <CardDescription className="text-gray-600">{job.company_name || "N/A"}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{job.job_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.is_remote ? "Remote" : job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Posted {new Date(job.posted_at).toLocaleDateString()}
                      </div>
                      {job.domain && <Badge variant="outline">{job.domain}</Badge>}
                    </div>
                    <div className="mt-6 text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <Link href={createPageLink(currentPage - 1)} passHref>
                  <Button variant="outline" disabled={currentPage === 1}>
                    Previous
                  </Button>
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link key={page} href={createPageLink(page)} passHref>
                    <Button variant={page === currentPage ? "default" : "outline"}>
                      {page}
                    </Button>
                  </Link>
                ))}
                <Link href={createPageLink(currentPage + 1)} passHref>
                  <Button variant="outline" disabled={currentPage === totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
