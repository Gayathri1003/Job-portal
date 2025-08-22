"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Briefcase, User, ArrowLeft, Upload, Info, FileText, Trash2, Star } from 'lucide-react'

interface JobSeekerProfile {
  name: string
  location: string
  education: string
  phone_number: string
  job_preferences: any
}

interface JobPreferences {
  domains: string[]
  preferred_locations: string[]
  remote_work: boolean
  salary_range: string
  job_types: string[]
  experience_level: string
  skills: string[]
}

interface Resume {
  id: number
  title: string
  file_url: string
  file_name: string
  is_default: boolean
  created_at: string
}

export default function SeekerProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewUser = searchParams.get("new") === "true"

  const [formData, setFormData] = useState<JobSeekerProfile>({
    name: "",
    location: "",
    education: "",
    phone_number: "",
    job_preferences: {},
  })

  const [preferences, setPreferences] = useState<JobPreferences>({
    domains: [],
    preferred_locations: [],
    remote_work: false,
    salary_range: "",
    job_types: [],
    experience_level: "",
    skills: [],
  })

  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchProfile()
    fetchResumes()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/seeker/profile")
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setFormData(data.profile)

          // Parse job preferences if they exist
          if (data.profile.job_preferences) {
            const prefs = data.profile.job_preferences
            setPreferences({
              domains: prefs.domains || [],
              preferred_locations: prefs.preferred_locations || [],
              remote_work: prefs.remote_work || false,
              salary_range: prefs.salary_range || "",
              job_types: prefs.job_types || [],
              experience_level: prefs.experience_level || "",
              skills: prefs.skills || [],
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/seeker/resumes")
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error("Error fetching resumes:", error)
    }
  }

  const handleArrayInput = (value: string, field: keyof JobPreferences) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    setPreferences((prev) => ({ ...prev, [field]: array }))
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    const formData = new FormData()
    formData.append("resume", file)
    formData.append("title", file.name.replace(".pdf", ""))

    try {
      const response = await fetch("/api/seeker/resumes", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        fetchResumes()
        setSuccess("Resume uploaded successfully!")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to upload resume")
      }
    } catch (error) {
      setError("Failed to upload resume")
    }
  }

  const setDefaultResume = async (resumeId: number) => {
    try {
      const response = await fetch(`/api/seeker/resumes/${resumeId}/default`, {
        method: "POST",
      })

      if (response.ok) {
        fetchResumes()
        setSuccess("Default resume updated!")
      }
    } catch (error) {
      setError("Failed to update default resume")
    }
  }

  const deleteResume = async (resumeId: number) => {
    try {
      const response = await fetch(`/api/seeker/resumes/${resumeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchResumes()
        setSuccess("Resume deleted successfully!")
      }
    } catch (error) {
      setError("Failed to delete resume")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Full name is required")
      setLoading(false)
      return
    }

    if (!formData.location.trim()) {
      setError("Location is required")
      setLoading(false)
      return
    }

    if (!formData.education.trim()) {
      setError("Education is required")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/seeker/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          job_preferences: preferences,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      setSuccess("Profile saved successfully!")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/seeker/dashboard")
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  Job Seeker Profile
                </CardTitle>
                <CardDescription>
                  {isNewUser
                    ? "Welcome! Please complete your profile to start applying for jobs."
                    : "Complete your profile to apply for jobs and get noticed by employers."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Your Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">
                        Current Location <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">
                        Education <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="education"
                        placeholder="e.g., B.Tech Computer Science, MBA"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Job Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Job Preferences</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="domains">Preferred Job Domains</Label>
                        <Input
                          id="domains"
                          placeholder="e.g., Software Development, Data Science"
                          value={preferences.domains.join(", ")}
                          onChange={(e) => handleArrayInput(e.target.value, "domains")}
                        />
                        <p className="text-xs text-gray-500">Separate multiple domains with commas</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience_level">Experience Level</Label>
                        <Select
                          value={preferences.experience_level}
                          onValueChange={(value) => setPreferences((prev) => ({ ...prev, experience_level: value }))}
                        >
                          <SelectTrigger id="experience_level">
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entry Level">Entry Level (0-2 years)</SelectItem>
                            <SelectItem value="Mid Level">Mid Level (2-5 years)</SelectItem>
                            <SelectItem value="Senior Level">Senior Level (5-10 years)</SelectItem>
                            <SelectItem value="Executive">Executive (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills</Label>
                      <Input
                        id="skills"
                        placeholder="e.g., React, Python, Project Management"
                        value={preferences.skills.join(", ")}
                        onChange={(e) => handleArrayInput(e.target.value, "skills")}
                      />
                      <p className="text-xs text-gray-500">Separate multiple skills with commas</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job_types">Preferred Job Types</Label>
                        <Input
                          id="job_types"
                          placeholder="e.g., Full-time, Part-time, Contract"
                          value={preferences.job_types.join(", ")}
                          onChange={(e) => handleArrayInput(e.target.value, "job_types")}
                        />
                        <p className="text-xs text-gray-500">Separate multiple job types with commas</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary_range">Expected Salary Range</Label>
                        <Input
                          id="salary_range"
                          placeholder="e.g., 5-10 LPA, $60k-$80k"
                          value={preferences.salary_range}
                          onChange={(e) => setPreferences((prev) => ({ ...prev, salary_range: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_locations">Preferred Work Locations</Label>
                      <Input
                        id="preferred_locations"
                        placeholder="e.g., Mumbai, Delhi, Remote"
                        value={preferences.preferred_locations.join(", ")}
                        onChange={(e) => handleArrayInput(e.target.value, "preferred_locations")}
                      />
                      <p className="text-xs text-gray-500">
                        Separate multiple locations with commas (leave empty if open to all locations)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote_work"
                        checked={preferences.remote_work}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, remote_work: !!checked }))}
                      />
                      <Label htmlFor="remote_work">Open to remote work</Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    <span className="text-red-500">*</span> Required fields
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resume Management Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Resume Management
                </CardTitle>
                <CardDescription>Upload and manage multiple resumes for different job applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Resume */}
                <div>
                  <Label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload resume</p>
                      <p className="text-xs text-gray-500">PDF files only, max 5MB</p>
                    </div>
                  </Label>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </div>

                {/* Resume List */}
                <div className="space-y-3">
                  {resumes.length === 0 ? (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">No resumes uploaded yet</p>
                    </div>
                  ) : (
                    resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{resume.title}</h4>
                            {resume.is_default && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{resume.file_name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!resume.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDefaultResume(resume.id)}
                              title="Set as default"
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(resume.file_url, "_blank")}
                            title="View resume"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteResume(resume.id)}
                            title="Delete resume"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Resume Tips</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Upload multiple resumes for different job types</li>
                    <li>• Set a default resume for quick applications</li>
                    <li>• Choose the best resume for each job application</li>
                    <li>• Keep resumes updated and relevant</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
