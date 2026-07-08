/**
 * Video yuklash API — faqat admin foydalana oladi.
 * POST /api/upload
 * Header: x-admin-key: <ADMIN_SECRET_KEY>
 * Body (FormData): file, courseId, lessonId
 *
 * Fayl R2 ga videos/{courseId}/{lessonId}.mp4 sifatida saqlanadi.
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'

export async function POST(req: NextRequest) {
  // Admin autentifikatsiyasi — haqiqiy auth sistema bo'lganda shu yerda token/session tekshirish lozim
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }

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
    return NextResponse.json({ error: 'file, courseId va lessonId majburiy' }, { status: 400 })
  }

  // Faqat video fayllar qabul qilinadi
  if (!file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'Faqat video fayl qabul qilinadi' }, { status: 400 })
  }

  const key = `videos/${courseId}/${lessonId}.mp4`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'video/mp4',
      })
    )

    return NextResponse.json({ success: true, key })
  } catch (err) {
    console.error('R2 yuklash xatosi:', err)
    return NextResponse.json({ error: 'R2 ga yuklashda xato' }, { status: 500 })
  }
}
