"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Users, Building } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "job_seeker"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit called!") // Added line
    e.preventDefault()
    setLoading(true)
    setError("")
    setDebugInfo("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    console.log("🔄 Starting registration process...")
    setDebugInfo("Starting registration...")
    console.log("📧 Email:", formData.email, "Role:", formData.role)

    try {
      setDebugInfo("Sending request...")
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      console.log("📊 Response status:", response.status)
      console.log("📊 Response ok:", response.ok)
      setDebugInfo(`Response: ${response.status} ${response.ok ? "OK" : "ERROR"}`)

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        const textResponse = await response.text()
        console.error("JSON parsing error:", jsonError)
        console.error("Raw response text:", textResponse)
        throw new Error(`Server responded with non-JSON: ${textResponse.substring(0, 100)}...`)
      }

      console.log("📦 Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      console.log("✅ Registration successful!")
      console.log("👤 User role:", data.user.role)

      setDebugInfo(`Registration successful! Role: ${data.user.role}`)

      // Redirect based on user role
      if (data.user.role === "job_seeker") {
        console.log("🎯 Navigating to profile setup")
        router.push("/seeker/profile?new=true")
      } else if (data.user.role === "employer") {
        console.log("🎯 Navigating to employer profile setup")
        router.push("/employer/profile?new=true")
      } else {
        console.log("Unknown role, navigating to home")
        router.push("/")
      }
    } catch (err: any) {
      console.error("❌ Registration error:", err)
      setError(err.message)
      setDebugInfo(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">Sarkar Daily Jobs</span>
          </div>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Join thousands of professionals finding their dream jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <Alert>
                <AlertDescription>Debug: {debugInfo}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>I am a:</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="job_seeker" id="job_seeker" />
                  <Label htmlFor="job_seeker" className="flex items-center cursor-pointer flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Job Seeker (Free)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="employer" id="employer" />
                  <Label htmlFor="employer" className="flex items-center cursor-pointer flex-1">
                    <Building className="h-4 w-4 mr-2" />
                    Employer (Free)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
