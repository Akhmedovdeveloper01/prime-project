/**
 * Admin: R2 ga video yuklash uchun presigned PUT URL beradi.
 * POST /api/admin/upload-url
 * Body: { courseId, lessonId, contentType? }
 * Frontend bu URL ga to'g'ridan-to'g'ri PUT qiladi (progress bar uchun qulay).
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET } from '@/lib/r2'
import { requireAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.courseId || !body?.lessonId) {
    return NextResponse.json({ error: 'courseId va lessonId majburiy' }, { status: 400 })
  }

  const { courseId, lessonId, contentType = 'video/mp4' } = body
  const key = `courses/${courseId}/${lessonId}.mp4`

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })
    return NextResponse.json({ uploadUrl, key })
  } catch (err) {
    console.error('Upload URL xatosi:', err)
    return NextResponse.json({ error: 'URL yaratib bo\'lmadi' }, { status: 500 })
  }
}
