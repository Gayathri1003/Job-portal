"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, ArrowLeft, Clock, Mail, FileText, Bell, MessageCircleQuestion } from 'lucide-react'
import { AnswerQuestionDialog } from "./answer-question-dialog"

interface Application {
  id: number
  job_id: number
  seeker_id: number
  status: "applied" | "accepted" | "rejected" | "waitlisted"
  application_date: string
  job_title: string
  company_name: string
  employer_notes?: string
  status_updated_at?: string
  questions: Array<{
    id: number
    question_text: string
    asked_at: string
    answer_text?: string
    answered_at?: string
  }>
}

interface Notification {
  id: number
  title: string
  message: string
  type: "success" | "error" | "info" | "warning"
  is_read: boolean
  created_at: string
  related_application_id?: number
}

export default function SeekerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchApplications()
    fetchNotifications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/seeker/applications")
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        setError("Failed to fetch applications.")
      }
    } catch (err) {
      console.error("Error fetching applications:", err)
      setError("Failed to fetch applications.")
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/seeker/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        console.error("Failed to fetch notifications.")
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/seeker/notifications/${notificationId}/read`, { method: "POST" })
      fetchNotifications() // Refresh notifications
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-600">Loading applications...</p>
      </div>
    )
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
              <Link href="/seeker/dashboard">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Applications</h1>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Recent Notifications
                </CardTitle>
                <CardDescription>Important updates regarding your applications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No new notifications.</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.is_read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${notification.is_read ? "text-gray-700" : "text-blue-800"}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <Badge variant="default" className="bg-blue-600 text-white">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${notification.is_read ? "text-gray-600" : "text-blue-700"}`}>
                        {notification.message}
                      </p>
                      <div className="flex justify-end mt-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:bg-blue-100"
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <div className="lg:col-span-2 space-y-6">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">You haven't applied for any jobs yet.</h3>
                <p className="text-gray-500 mt-2">
                  Start exploring jobs on our{" "}
                  <Link href="/jobs" className="text-blue-600 hover:underline">
                    jobs page
                  </Link>
                  .
                </p>
              </div>
            ) : (
              applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{app.job_title}</CardTitle>
                        <CardDescription className="text-gray-600">{app.company_name}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          app.status === "accepted"
                            ? "default"
                            : app.status === "rejected"
                              ? "destructive"
                              : app.status === "waitlisted"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      Applied on {new Date(app.application_date).toLocaleDateString()}
                      {app.status_updated_at && app.status !== "applied" && (
                        <span className="ml-2">
                          (Status updated: {new Date(app.status_updated_at).toLocaleDateString()})
                        </span>
                      )}
                    </div>

                    {app.employer_notes && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Employer Notes:</h4>
                        <p className="text-sm text-blue-800">{app.employer_notes}</p>
                      </div>
                    )}

                    {/* Questions and Answers */}
                    <div className="mt-4 space-y-3">
                      <h5 className="font-medium text-sm flex items-center">
                        <MessageCircleQuestion className="h-4 w-4 mr-2" />
                        Questions & Answers
                      </h5>
                      {app.questions && app.questions.length > 0 ? (
                        app.questions.map((qa, idx) => (
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
                              <div className="mt-1">
                                <p className="text-sm text-gray-500 italic mb-2">No answer yet.</p>
                                <AnswerQuestionDialog questionId={qa.id} />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No questions asked for this application yet.</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Link href={`/jobs/${app.job_id}`}>
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                      {app.status === "accepted" && (
                        <Button variant="default" size="sm" onClick={() => window.location.href = `mailto:${app.company_name} HR`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Contact Employer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
