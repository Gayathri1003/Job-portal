import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Update user payment status
    await sql`
      UPDATE users 
      SET is_paid = true 
      WHERE id = ${user.id}
    `

    // Record payment
    await sql`
      INSERT INTO payments (user_id, razorpay_payment_id, razorpay_order_id, status, amount, currency)
      VALUES (${user.id}, ${razorpay_payment_id}, ${razorpay_order_id}, 'completed', 10000, 'INR')
    `

    return NextResponse.json({ message: "Payment verified successfully" })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
