"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, CreditCard, Shield } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Sarkar Daily Jobs",
        description: "Account Activation Fee",
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyResponse.ok) {
              router.push("/seeker/profile?payment=success")
            } else {
              throw new Error(verifyData.error || "Payment verification failed")
            }
          } catch (err: any) {
            setError(err.message)
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#2563eb",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Activate Your Account</CardTitle>
          <CardDescription>One-time payment of ₹100 to access all job opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Access to unlimited job applications</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Global job opportunities</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Profile visibility to employers</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Application tracking dashboard</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Activation Fee</span>
              <span className="text-2xl font-bold">₹100</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">One-time payment • Lifetime access</p>
          </div>

          <Button onClick={handlePayment} className="w-full" disabled={loading} size="lg">
            {loading ? "Processing..." : "Pay ₹100 & Activate Account"}
          </Button>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Secure payment powered by Razorpay</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
