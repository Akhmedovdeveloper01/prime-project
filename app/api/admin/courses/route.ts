/**
 * Admin: Kurslar CRUD.
 * GET  /api/admin/courses         — barcha kurslar (lessons soni bilan)
 * POST /api/admin/courses         — yangi kurs
 * PATCH /api/admin/courses?id=... — kurs yangilash (publish toggle va h.k.)
 * DELETE /api/admin/courses?id=.. — kurs o'chirish
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  // Bitta kurs — ?id= parametr bilan
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data, error } = await supabaseAdmin.from('courses').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ course: data })
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ courses: data })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ error: 'title majburiy' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({ title: body.title, description: body.description, price: body.price ?? 0, tag: body.tag })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
