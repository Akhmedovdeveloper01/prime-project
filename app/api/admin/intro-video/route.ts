import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const { key } = await req.json().catch(() => ({}))
  if (!key) return NextResponse.json({ error: 'key majburiy' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key: 'intro_video_key', value: key }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('key', 'intro_video_key')

  const value = (data as { key: string; value: string }[] | null)?.[0]?.value ?? null
  return NextResponse.json({ key: value })
}
