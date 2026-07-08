/**
 * Supabase klientlari.
 * - supabase      → browser (client components) uchun
 * - supabaseAdmin → server (API routes) uchun, service role key bilan
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder'
const secretKey = process.env.SUPABASE_SECRET_KEY ?? 'placeholder'

// Browser client
export const supabase = createClient(url, publishableKey)

// Server (admin) client — API routes da ishlatiladi
// persistSession: false — browser client bilan konflikt bo'lmasligi uchun
export const supabaseAdmin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// --- TypeScript types ---
export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'student' | 'admin'
  is_paid: boolean
  created_at: string
}

export type Course = {
  id: string
  title: string
  description: string | null
  price: number
  tag: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
}

export type Lesson = {
  id: string
  course_id: string
  title: string
  duration: string | null
  order_index: number
  video_key: string | null
  is_free: boolean
  created_at: string
}

export type WatchHistory = {
  id: string
  user_id: string
  lesson_id: string
  watched_seconds: number
  total_seconds: number
  completed: boolean
  last_watched_at: string
}

export type Payment = {
  id: string
  user_id: string
  course_id: string
  amount: number
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
}

// --- Server-side helpers ---

/** Authorization headerdan Supabase user ni oladi */
export async function getUserFromRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

/** Foydalanuvchi admin ekanligini tekshiradi */
export async function requireAdmin(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

/** Foydalanuvchi login + to'lagan ekanligini tekshiradi */
export async function requirePaidUser(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_paid, role')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  // Admin ham videolarni ko'ra oladi
  if (profile.role === 'admin' || profile.is_paid) return user
  return null
}
