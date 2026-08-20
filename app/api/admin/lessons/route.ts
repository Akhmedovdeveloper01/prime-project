/**
 * Admin: Darslar CRUD.
 * GET    /api/admin/lessons?courseId=...
 * POST   /api/admin/lessons
 * PATCH  /api/admin/lessons?id=...
 * DELETE /api/admin/lessons?id=...  (R2 dan ham o'chiradi)
 */
import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId majburiy' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lessons: data })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.courseId) {
    return NextResponse.json({ error: 'title va courseId majburiy' }, { status: 400 })
  }

  // Oxirgi darsning order_index ni topamiz
  const { data: last } = await supabaseAdmin
    .from('lessons')
    .select('order_index')
    .eq('course_id', body.courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      course_id: body.courseId,
      title: body.title,
      duration: body.duration,
      order_index: (last?.order_index ?? 0) + 1,
      is_free: body.is_free ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Noto\'g\'ri so\'rov' }, { status: 400 })

  // Faqat lessons jadvalidagi ustunlarni yangilaymiz — boshqa kalitlar (masalan courseId)
  // schema xatosiga sabab bo'lmasligi kerak.
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.duration !== undefined) updates.duration = body.duration
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.video_key !== undefined) updates.video_key = body.video_key
  if (body.order_index !== undefined) updates.order_index = body.order_index

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id majburiy' }, { status: 400 })

  // Dars video_key sini olib R2 dan o'chiramiz
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('video_key')
    .eq('id', id)
    .single()

  if (lesson?.video_key) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: lesson.video_key }))
    } catch (err) {
      console.warn('R2 dan o\'chirishda xato:', err)
    }
  }

  // Avval watch_history ni o'chiramiz (foreign key constraint)
  await supabaseAdmin.from('watch_history').delete().eq('lesson_id', id)

  const { error } = await supabaseAdmin.from('lessons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
