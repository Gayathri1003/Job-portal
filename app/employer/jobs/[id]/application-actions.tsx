"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Clock, Mail, Phone, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface ApplicationActionsProps {
  applicationId: number
  currentStatus: string
  applicantEmail: string
  applicantPhone?: string
}

export function ApplicationActions({
  applicationId,
  currentStatus,
  applicantEmail,
  applicantPhone,
}: ApplicationActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStatusUpdate = async (status: string) => {
    // If notes are required for rejection and not provided, show notes input
    if (status === "rejected" && !showNotes) {
      setShowNotes(true)
      setPendingAction(status)
      return
    }
    // If notes are optional for accepted/waitlisted and not shown, show notes input
    if ((status === "accepted" || status === "waitlisted") && !showNotes) {
      setShowNotes(true)
      setPendingAction(status)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update application")
      }

      setSuccess(`Application ${status} successfully!`)
      toast({
        title: "Application Status Updated",
        description: `Application has been ${status}.`,
        variant: "default",
      })
      setShowNotes(false)
      setPendingAction(null)
      setNotes("")

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContactApplicant = (method: "email" | "phone") => {
    if (method === "email") {
      window.location.href = `mailto:${applicantEmail}?subject=Regarding your job application`
    } else if (method === "phone" && applicantPhone) {
      window.location.href = `tel:${applicantPhone}`
    }
  }

  if (currentStatus !== "applied") {
    return (
      <div className="space-y-3">
        {currentStatus === "accepted" && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Application Accepted</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleContactApplicant("email")}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  {applicantPhone && (
                    <Button variant="outline" size="sm" onClick={() => handleContactApplicant("phone")}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "waitlisted" && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">Application Waitlisted</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleStatusUpdate("accepted")} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Accept Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "rejected" && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Application Rejected</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
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

      {showNotes && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <Label htmlFor="notes">
            Add notes {pendingAction === "rejected" ? "(required)" : "(optional)"}
          </Label>
          <Textarea
            id="notes"
            placeholder={
              pendingAction === "accepted"
                ? "Add any notes for the candidate or your team..."
                : pendingAction === "waitlisted"
                  ? "Explain why the candidate is waitlisted..."
                  : "Provide feedback for the candidate..."
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex space-x-2">
            <Button
              onClick={() => handleStatusUpdate(pendingAction!)}
              disabled={loading || (pendingAction === "rejected" && !notes.trim())}
              size="sm"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Confirm ${pendingAction}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotes(false)
                setPendingAction(null)
                setNotes("")
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!showNotes && (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleStatusUpdate("accepted")}
            disabled={loading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={() => handleStatusUpdate("waitlisted")}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
          >
            <Clock className="h-4 w-4 mr-2" />
            Waitlist
          </Button>
          <Button
            onClick={() => handleStatusUpdate("rejected")}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-red-500 text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}
