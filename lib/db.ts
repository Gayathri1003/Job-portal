import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: number
  email: string
  password_hash: string
  role: "job_seeker" | "employer" | "admin"
  is_paid: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface JobSeekerProfile {
  id: number
  user_id: number
  name: string
  location?: string
  education?: string
  phone_number?: string // Added phone_number
  resume_url?: string // Deprecated, now using resumes table
  job_preferences?: any
  created_at: string
  updated_at: string
}

export interface EmployerProfile {
  id: number
  user_id: number
  company_name: string
  website?: string
  logo_url?: string
  location?: string
  industry?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: number
  employer_id: number
  title: string
  description: string
  experience_required?: string
  salary?: string
  location?: string
  country?: string
  is_remote: boolean
  job_type?: string
  domain?: string
  is_open: boolean
  posted_at: string
  updated_at: string
  company_name?: string
  company_logo?: string
}

export interface Application {
  id: number
  job_id: number
  seeker_id: number
  status: "applied" | "accepted" | "rejected" | "waitlisted" // Added waitlisted
  application_date: string
  job_title?: string
  company_name?: string
  resume_id?: number // Added resume_id
  employer_notes?: string // Added employer_notes
  status_updated_at?: string // Added status_updated_at
}

export interface Payment {
  id: number
  user_id: number
  razorpay_payment_id?: string
  razorpay_order_id?: string
  status: "pending" | "completed" | "failed"
  amount: number
  currency: string
  paid_at: string
}

export interface Resume {
  id: number
  user_id: number
  title: string
  file_url: string
  file_name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: "success" | "error" | "info" | "warning"
  is_read: boolean
  created_at: string
  related_application_id?: number
}

export interface EmployerQuestion {
  id: number
  application_id: number
  employer_id: number
  question_text: string
  asked_at: string
}

export interface SeekerAnswer {
  id: number
  question_id: number
  seeker_id: number
  answer_text: string
  answered_at: string
}
