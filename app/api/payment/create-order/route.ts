import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { razorpay, ACTIVATION_AMOUNT } from "@/lib/razorpay"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    console.log("Create Order API: Token from cookies:", token ? "Present" : "Not Present")

    if (!token) {
      console.log("Create Order API: No token found, returning unauthorized.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    console.log("Create Order API: User from token:", user ? user.email : "None")

    if (!user || user.role !== "job_seeker") {
      console.log("Create Order API: User not found or not job_seeker, returning unauthorized.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.is_paid) {
      console.log("Create Order API: User already paid, returning bad request.")
      return NextResponse.json({ error: "Account already activated" }, { status: 400 })
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: ACTIVATION_AMOUNT,
      currency: "INR",
      receipt: `activation_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id.toString(),
        purpose: "account_activation",
      },
    })

    console.log("Create Order API: Order created successfully.")
    return NextResponse.json(order)
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
