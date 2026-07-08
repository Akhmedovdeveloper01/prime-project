/**
 * Server-side video upload — CORS muammosini hal qiladi.
 * POST /api/admin/upload
 * FormData: file (video), lessonId, courseId
 * Server faylni qabul qilib R2 ga yuklaydi, keyin lesson.video_key ni yangilaydi.
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'
import { requireAdmin, supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60 // Vercel: 60 soniya timeout

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'FormData o\'qishda xato' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const courseId = formData.get('courseId') as string | null
  const lessonId = formData.get('lessonId') as string | null

  if (!file || !courseId || !lessonId) {
    return NextResponse.json({ error: 'file, courseId, lessonId majburiy' }, { status: 400 })
  }

  const key = `courses/${courseId}/${lessonId}.mp4`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'video/mp4',
    }))
  } catch (err) {
    console.error('R2 upload xatosi:', err)
    return NextResponse.json({ error: 'R2 ga yuklashda xato' }, { status: 500 })
  }

  // lesson.video_key ni yangilaymiz
  const { error } = await supabaseAdmin
    .from('lessons')
    .update({ video_key: key })
    .eq('id', lessonId)

  if (error) {
    console.error('video_key yangilashda xato:', error.message)
    return NextResponse.json({ error: 'video_key saqlanmadi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, key })
}
