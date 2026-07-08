import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalUsers },
    { count: todayNew },
    { count: paidUsers },
    { data: payData },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_paid', true),
    supabaseAdmin.from('payments').select('amount').eq('status', 'paid'),
  ])

  const totalRevenue = (payData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    todayNew: todayNew ?? 0,
    paidUsers: paidUsers ?? 0,
    totalRevenue,
  })
}
