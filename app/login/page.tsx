"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    console.log("🔄 Starting login process...")
    setDebugInfo("Starting login...")

    try {
      console.log("📧 Email:", formData.email)
      setDebugInfo("Sending request...")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify(formData),
      })

      console.log("📊 Response status:", response.status)
      console.log("📊 Response ok:", response.ok)
      setDebugInfo(`Response: ${response.status} ${response.ok ? "OK" : "ERROR"}`)

      // Clone the response so we can read its body multiple times if needed
      const clonedResponse = response.clone()
      let data

      try {
        data = await response.json() // Try to parse as JSON first
      } catch (jsonError) {
        const textResponse = await clonedResponse.text() // If JSON fails, read as text from the clone
        console.error("JSON parsing error:", jsonError)
        console.error("Raw response text:", textResponse)
        throw new Error(`Server responded with non-JSON: ${textResponse.substring(0, 100)}...`)
      }

      console.log("📦 Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      console.log("✅ Login successful!")
      console.log("👤 User role:", data.user.role)
      console.log("💰 Is paid:", data.user.is_paid)

      setDebugInfo(`Login successful! Role: ${data.user.role}`)

      // Redirect based on user role
      if (data.user.role === "job_seeker") {
        console.log("🎯 Navigating to seeker dashboard")
        router.push("/seeker/dashboard")
      } else if (data.user.role === "employer") {
        console.log("🎯 Navigating to employer dashboard")
        router.push("/employer/dashboard")
      } else if (data.user.role === "admin") {
        console.log("🎯 Navigating to admin dashboard")
        router.push("/admin/dashboard")
      } else {
        console.log("Unknown role, navigating to home")
        router.push("/")
      }
    } catch (err: any) {
      console.error("❌ Login error:", err)
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
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
