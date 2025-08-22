import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, ArrowLeft, Edit, Users, Eye, EyeOff, MapPin, Clock, DollarSign, FileText, Phone, Mail, MessageCircleQuestion } from 'lucide-react'
import type { Job, Application, EmployerQuestion, SeekerAnswer } from "@/lib/db"
import { ApplicationActions } from "./application-actions"
import { AskQuestionDialog } from "./ask-question-dialog"

async function getJobWithApplications(jobId: string, employerId: number) {
  // Get job details
  const jobs = await sql`
    SELECT j.*, ep.company_name, ep.logo_url as company_logo
    FROM jobs j
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
    WHERE j.id = ${Number.parseInt(jobId)} AND j.employer_id = ${employerId}
  `

  if (jobs.length === 0) return null

  // Get applications for this job with resume information
  const applications = await sql`
    SELECT
      a.*,
      jsp.name as applicant_name,
      jsp.location as applicant_location,
      jsp.education,
      jsp.phone_number,
      jsp.job_preferences,
      u.email as applicant_email,
      r.title as resume_title,
      r.file_url as resume_url,
      r.file_name as resume_file_name
    FROM applications a
    JOIN users u ON a.seeker_id = u.id
    LEFT JOIN job_seeker_profiles jsp ON a.seeker_id = jsp.user_id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE a.job_id = ${Number.parseInt(jobId)}
    ORDER BY a.application_date DESC
  `

  // Fetch questions and answers for each application
  const applicationsWithQA = await Promise.all(
    applications.map(async (app) => {
      const questions = await sql`
        SELECT
          eq.id,
          eq.question_text,
          eq.asked_at,
          sa.answer_text,
          sa.answered_at
        FROM employer_questions eq
        LEFT JOIN seeker_answers sa ON eq.id = sa.question_id
        WHERE eq.application_id = ${app.id}
        ORDER BY eq.asked_at ASC
      `
      return { ...app, questions: questions as (EmployerQuestion & { answer_text?: string; answered_at?: string })[] }
    })
  )

  return {
    job: jobs[0] as Job,
    applications: applicationsWithQA,
  }
}

export default async function JobManagePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  if (!user || user.role !== "employer") {
    redirect("/login")
  }

  const data = await getJobWithApplications(params.id, user.id)
  if (!data) {
    notFound()
  }

  const { job, applications } = data

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.is_remote ? "Remote" : job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Posted {new Date(job.posted_at).toLocaleDateString()}
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={job.is_open ? "default" : "secondary"}>{job.is_open ? "Active" : "Closed"}</Badge>
                    <Button variant="outline" size="sm" disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      {job.is_open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Job Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {job.experience_required && (
                    <div>
                      <h4 className="font-medium mb-2">Experience Required</h4>
                      <p className="text-gray-700">{job.experience_required}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
                    {job.is_remote && <Badge variant="outline">Remote</Badge>}
                    {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Applications ({applications.length})
                </CardTitle>
                <CardDescription>Review and manage job applications</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600">Applications will appear here when job seekers apply</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-lg">{application.applicant_name || "Anonymous"}</h4>
                              <Badge
                                variant={
                                  application.status === "accepted"
                                    ? "default"
                                    : application.status === "rejected"
                                      ? "destructive"
                                      : application.status === "waitlisted"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {application.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <p className="flex items-center">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {application.applicant_email}
                                </p>
                                {application.phone_number && (
                                  <p className="flex items-center">
                                    <Phone className="h-3 w-3 mr-2" />
                                    {application.phone_number}
                                  </p>
                                )}
                                {application.applicant_location && (
                                  <p className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-2" />
                                    {application.applicant_location}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                {application.education && (
                                  <p>
                                    <strong>Education:</strong> {application.education}
                                  </p>
                                )}
                                <p className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2" />
                                  Applied {new Date(application.application_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Job Preferences */}
                            {application.job_preferences && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-sm mb-2">Job Preferences</h5>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {application.job_preferences.skills &&
                                    application.job_preferences.skills.length > 0 && (
                                      <p>
                                        <strong>Skills:</strong> {application.job_preferences.skills.join(", ")}
                                      </p>
                                    )}
                                  {application.job_preferences.experience_level && (
                                    <p>
                                      <strong>Experience:</strong> {application.job_preferences.experience_level}
                                    </p>
                                  )}
                                  {application.job_preferences.salary_range && (
                                    <p>
                                      <strong>Expected Salary:</strong> {application.job_preferences.salary_range}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Employer Notes */}
                            {application.employer_notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-sm mb-1">Your Notes</h5>
                                <p className="text-sm text-gray-700">{application.employer_notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {application.resume_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Resume
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Resume Information */}
                        {application.resume_url && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Resume: {application.resume_title || application.resume_file_name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Questions and Answers */}
                        <div className="mt-4 space-y-3">
                          <h5 className="font-medium text-sm flex items-center">
                            <MessageCircleQuestion className="h-4 w-4 mr-2" />
                            Questions & Answers
                          </h5>
                          {application.questions && application.questions.length > 0 ? (
                            application.questions.map((qa, idx) => (
                              <div key={idx} className="border-l-2 border-gray-200 pl-4 py-2">
                                <p className="font-medium text-gray-800">{qa.question_text}</p>
                                <p className="text-xs text-gray-500 mb-1">
                                  Asked: {new Date(qa.asked_at).toLocaleDateString()}
                                </p>
                                {qa.answer_text ? (
                                  <div className="bg-gray-100 p-2 rounded-md mt-1">
                                    <p className="text-sm text-gray-700">{qa.answer_text}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Answered: {new Date(qa.answered_at!).toLocaleDateString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic mt-1">No answer yet.</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No questions asked yet.</p>
                          )}
                          <AskQuestionDialog applicationId={application.id} />
                        </div>

                        {/* Action Buttons */}
                        <ApplicationActions
                          applicationId={application.id}
                          currentStatus={application.status}
                          applicantEmail={application.applicant_email}
                          applicantPhone={application.phone_number}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Applications</span>
                  <span className="font-medium">{applications.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Review</span>
                  <span className="font-medium">{applications.filter((a) => a.status === "applied").length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accepted</span>
                  <span className="font-medium text-green-600">
                    {applications.filter((a) => a.status === "accepted").length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Waitlisted</span>
                  <span className="font-medium text-yellow-600">
                    {applications.filter((a) => a.status === "waitlisted").length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="font-medium text-red-600">
                    {applications.filter((a) => a.status === "rejected").length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                  {job.is_open ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {job.is_open ? "Close Job" : "Reopen Job"}
                </Button>
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Page
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
