"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Building, ArrowLeft } from "lucide-react"

interface EmployerProfile {
  company_name: string
  website: string
  location: string
  industry: string
  description: string
}

export default function EmployerProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewUser = searchParams.get("new") === "true"

  const [formData, setFormData] = useState<EmployerProfile>({
    company_name: "",
    website: "",
    location: "",
    industry: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/employer/profile")
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setFormData(data.profile)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate required fields
    if (!formData.company_name.trim()) {
      setError("Company name is required")
      setLoading(false)
      return
    }

    if (!formData.location.trim()) {
      setError("Location is required")
      setLoading(false)
      return
    }

    if (!formData.industry.trim()) {
      setError("Industry is required")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/employer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      setSuccess("Profile saved successfully!")

      // Redirect to job posting page for new users, or dashboard for existing
      setTimeout(() => {
        if (isNewUser) {
          router.push("/employer/jobs/new")
        } else {
          router.push("/employer/dashboard")
        }
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
              <Link href="/employer/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-6 w-6 mr-2" />
              Company Profile
            </CardTitle>
            <CardDescription>
              {isNewUser
                ? "Welcome! Please complete your company profile to start posting jobs."
                : "Update your company information to attract the best talent."}
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

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  placeholder="Your Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
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
                <Label htmlFor="industry">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell job seekers about your company, culture, and what makes you unique..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
    </div>
  )
}
