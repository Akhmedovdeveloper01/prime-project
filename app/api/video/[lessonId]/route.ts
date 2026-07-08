/**
 * Video uchun signed GET URL beradi.
 * GET /api/video/{lessonId}
 * Header: Authorization: Bearer <supabase-access-token>
 * Foydalanuvchi login + to'lagan (yoki admin) bo'lsa 1 soatlik URL beradi.
 */
import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET } from '@/lib/r2'
import { requirePaidUser, supabaseAdmin } from '@/lib/supabase'

const EXPIRES_IN = 3600 // 1 soat

export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const user = await requirePaidUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Ruxsat yo\'q yoki to\'lov amalga oshirilmagan' }, { status: 403 })
  }

  // Dars ma'lumotlarini DB dan olamiz (video_key ni bilish uchun)
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('video_key, course_id')
    .eq('id', params.lessonId)
    .single()

  if (error || !lesson?.video_key) {
    return NextResponse.json({ error: 'Dars topilmadi yoki video yuklanmagan' }, { status: 404 })
  }

  try {
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: lesson.video_key })
    const url = await getSignedUrl(r2, command, { expiresIn: EXPIRES_IN })
    return NextResponse.json({ url, expiresIn: EXPIRES_IN, key: lesson.video_key })
  } catch (err) {
    console.error('Signed URL xatosi:', err)
    return NextResponse.json({ error: 'Video URL yaratib bo\'lmadi' }, { status: 500 })
  }
}
