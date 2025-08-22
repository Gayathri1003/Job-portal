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

interface AnswerQuestionDialogProps {
  questionId: number
}

export function AnswerQuestionDialog({ questionId }: AnswerQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [answerText, setAnswerText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!answerText.trim()) {
      setError("Answer cannot be empty.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/seeker/applications/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit answer.")
      }

      toast({
        title: "Answer Submitted",
        description: "Your answer has been sent to the employer.",
        variant: "default",
      })
      setOpen(false)
      setAnswerText("")
      router.refresh() // Refresh the page to show the new answer
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
        <Button variant="outline" size="sm">
          <MessageCircleQuestion className="h-4 w-4 mr-2" />
          Answer Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Answer Question</DialogTitle>
          <DialogDescription>
            Provide your answer to the employer's question below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="answer">Your Answer</Label>
            <Textarea
              id="answer"
              placeholder="Type your answer here..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Answer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
