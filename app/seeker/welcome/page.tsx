"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, User, Briefcase, ArrowRight } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to profile setup after 5 seconds
    const timer = setTimeout(() => {
      router.push("/seeker/profile?new=true")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Welcome to Sarkar Daily Jobs!</CardTitle>
          <CardDescription>Your account has been created successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Account created successfully</span>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Complete your profile next</span>
            </div>
            <div className="flex items-center space-x-3">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <span className="text-sm">Start applying to jobs</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Complete your profile</li>
              <li>2. Upload your resume</li>
              <li>3. Browse and apply to jobs</li>
            </ol>
          </div>

          <Link href="/seeker/profile?new=true">
            <Button className="w-full" size="lg">
              Complete Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-center text-gray-600">You'll be redirected automatically in a few seconds...</p>
        </CardContent>
      </Card>
    </div>
  )
}
