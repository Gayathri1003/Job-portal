"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageCircleQuestion, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface AskQuestionDialogProps {
  applicationId: number
}

export function AskQuestionDialog({ applicationId }: AskQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      setError("Question cannot be empty.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to ask question.")
      }

      toast({
        title: "Question Sent",
        description: "Your question has been sent to the applicant.",
        variant: "default",
      })
      setOpen(false)
      setQuestionText("")
      router.refresh() // Refresh the page to show the new question
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <MessageCircleQuestion className="h-4 w-4 mr-2" />
          Ask a Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ask Applicant a Question</DialogTitle>
          <DialogDescription>
            Enter your question below. The applicant will be notified and can respond from their dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="e.g., Can you elaborate on your experience with React hooks?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
