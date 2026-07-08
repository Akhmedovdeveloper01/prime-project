/**
 * Admin: To'lovlar ro'yxati va status boshqaruvi.
 * GET   /api/admin/payments?page=1&status=pending|paid|rejected
 * PATCH /api/admin/payments?id=... — { status: 'paid' | 'rejected' }
 *   → paid bo'lsa user.is_paid = true qilinadi
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  const status = req.nextUrl.searchParams.get('status') // 'pending' | 'paid' | 'rejected' | null

  let query = supabaseAdmin
    .from('payments')
    .select('*, profiles(full_name, email), courses(title)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payments: data, total: count, page, pageSize: PAGE_SIZE })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  const { status } = await req.json().catch(() => ({}))
  if (!['paid', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status: paid yoki rejected bo\'lishi kerak' }, { status: 400 })
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // To'lov tasdiqlanganda foydalanuvchini to'lagan deb belgilaymiz
  if (status === 'paid' && payment) {
    await supabaseAdmin
      .from('profiles')
      .update({ is_paid: true })
      .eq('id', payment.user_id)
  }

  return NextResponse.json({ payment })
}
