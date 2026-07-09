import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET } from '@/lib/r2'
import { requireAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Faqat admin uchun' }, { status: 403 })

  const { contentType = 'video/mp4' } = await req.json().catch(() => ({}))
  const key = 'intro/intro-video.mp4'

  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })
  return NextResponse.json({ uploadUrl, key })
}
