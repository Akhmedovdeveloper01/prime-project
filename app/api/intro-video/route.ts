import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET } from '@/lib/r2'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('key', 'intro_video_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const value = (data as { key: string; value: string }[] | null)?.[0]?.value
  if (!value) return NextResponse.json({ error: 'Intro video topilmadi' }, { status: 404 })

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: value })
  const url = await getSignedUrl(r2, command, { expiresIn: 3600 })
  return NextResponse.json({ url })
}
