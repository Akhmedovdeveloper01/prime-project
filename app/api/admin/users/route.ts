/**
 * Admin: Foydalanuvchilar ro'yxati va is_paid boshqaruvi.
 * GET   /api/admin/users?page=1&search=...&filter=paid|unpaid
 * POST  /api/admin/users — { email, password, full_name, is_paid }
 * PATCH /api/admin/users?id=... — { is_paid: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  const search = req.nextUrl.searchParams.get('search') ?? ''
  const filter = req.nextUrl.searchParams.get('filter') // 'paid' | 'unpaid' | null

  let query = supabaseAdmin
    .from('profiles')
    .select('*, watch_history(watched_seconds)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (filter === 'paid') query = query.eq('is_paid', true)
  if (filter === 'unpaid') query = query.eq('is_paid', false)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, pageSize: PAGE_SIZE })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'email va password majburiy' }, { status: 400 })
  }

  // Auth.users ga yangi foydalanuvchi qo'shamiz
  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name ?? '' },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // profiles jadvalini yangilaymiz (trigger orqali yaratilgan bo'lishi kerak)
  if (body.is_paid || body.full_name) {
    await supabaseAdmin
      .from('profiles')
      .update({
        ...(body.full_name ? { full_name: body.full_name } : {}),
        ...(body.is_paid ? { is_paid: true } : {}),
      })
      .eq('id', created.user.id)
  }

  return NextResponse.json({ ok: true, userId: created.user.id }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_paid: body.is_paid })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}
