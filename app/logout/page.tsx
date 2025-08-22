"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Briefcase } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to login page after 2 seconds
    const timer = setTimeout(() => {
      router.push("/login")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold">Sarkar Daily Jobs</span>
          </div>
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Logged Out Successfully</CardTitle>
          <CardDescription>You have been safely logged out of your account</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">Thank you for using Sarkar Daily Jobs!</p>
          <p className="text-xs text-gray-500">You'll be redirected to the login page in a moment...</p>
        </CardContent>
      </Card>
    </div>
  )
}
