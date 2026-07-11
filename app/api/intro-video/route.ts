import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET } from '@/lib/r2'

const INTRO_KEY = 'intro/intro-video.mp4'

export async function GET() {
  try {
    if (!R2_BUCKET) return NextResponse.json({ error: 'R2_BUCKET_NAME env var yoq' }, { status: 500 })
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: INTRO_KEY })
    const url = await getSignedUrl(r2, command, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Noma\'lum xato'
    console.error('[intro-video]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
