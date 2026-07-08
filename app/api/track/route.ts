/**
 * Ko'rish tarixini yangilaydi.
 * POST /api/track
 * Body: { lessonId, watchedSeconds, totalSeconds, completed? }
 * Har 30 sekundda frontend chaqiradi.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Login talab etiladi' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.lessonId || body.watchedSeconds == null) {
    return NextResponse.json({ error: 'lessonId va watchedSeconds majburiy' }, { status: 400 })
  }

  const { lessonId, watchedSeconds, totalSeconds = 0, completed = false } = body

  const { error } = await supabaseAdmin
    .from('watch_history')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        watched_seconds: watchedSeconds,
        total_seconds: totalSeconds,
        completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) {
    console.error('Watch history xatosi:', error.message)
    return NextResponse.json({ error: 'Saqlashda xato' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
