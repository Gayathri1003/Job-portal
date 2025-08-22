import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TestAuthPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  let user = null
  let error = null

  if (token) {
    try {
      user = await getUserFromToken(token)
    } catch (err: any) {
      error = err.message
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Token Status:</h3>
            <p className="text-sm text-gray-600">{token ? "✅ Token exists" : "❌ No token"}</p>
          </div>

          {error && (
            <div>
              <h3 className="font-medium text-red-600">Error:</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {user && (
            <div>
              <h3 className="font-medium">User Info:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>Paid: {user.is_paid ? "Yes" : "No"}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Link href="/login">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Login
              </Button>
            </Link>
            <Link href="/employer/dashboard">
              <Button variant="outline" className="w-full bg-transparent">
                Test Employer Dashboard
              </Button>
            </Link>
            <Link href="/seeker/dashboard">
              <Button variant="outline" className="w-full bg-transparent">
                Test Seeker Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
