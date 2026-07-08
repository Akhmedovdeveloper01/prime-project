'use client'
/**
 * Xavfsiz video player.
 * - Signed URL ni /api/video/{lessonId} dan oladi
 * - Har 30 sekundda /api/track ga watched_seconds yuboradi
 * - URL 50 daqiqada avtomatik yangilanadi
 * - Dars tugaganda completed=true yuboradi
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface VideoPlayerProps {
  lessonId: string
  title?: string
  totalSeconds?: number
}

const REFRESH_MS = 50 * 60 * 1000   // 50 daqiqa — URL yangilash
const TRACK_INTERVAL_MS = 30 * 1000  // 30 soniya — tracking

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export default function VideoPlayer({ lessonId, title, totalSeconds = 0 }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const refreshTimer = useRef<NodeJS.Timeout | null>(null)
  const trackTimer = useRef<NodeJS.Timeout | null>(null)
  const watchedRef = useRef(0)  // progress bar olmaydi, ref bilan track qilamiz

  const fetchUrl = useCallback(async () => {
    try {
      setError(null)
      const token = await getToken()
      const res = await fetch(`/api/video/${lessonId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 401) { setError('Videoni ko\'rish uchun tizimga kiring.'); return }
      if (res.status === 403) { setError('Bu kurs uchun to\'lov amalga oshirilmagan.'); return }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error ?? `Xato ${res.status}`)
        return
      }
      const { url } = await res.json()
      setSignedUrl(url)
    } catch (e) {
      setError(`Tarmoq xatosi: ${e instanceof Error ? e.message : 'Noma\'lum'}`)
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  // Ko'rish vaqtini serverga yuborish
  const sendTrack = useCallback(async (completed = false) => {
    const watched = Math.floor(videoRef.current?.currentTime ?? watchedRef.current)
    if (!watched) return
    try {
      const token = await getToken()
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId, watchedSeconds: watched, totalSeconds, completed }),
      })
    } catch {
      // tracking xatosi asosiy oqimni to'xtatmasin
    }
  }, [lessonId, totalSeconds])

  // Dars o'zgarganda URL yangilanadi, tracking boshlanadi
  useEffect(() => {
    setLoading(true)
    setSignedUrl(null)
    setError(null)
    watchedRef.current = 0
    fetchUrl()

    if (refreshTimer.current) clearInterval(refreshTimer.current)
    refreshTimer.current = setInterval(fetchUrl, REFRESH_MS)

    if (trackTimer.current) clearInterval(trackTimer.current)
    trackTimer.current = setInterval(() => sendTrack(false), TRACK_INTERVAL_MS)

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
      if (trackTimer.current) clearInterval(trackTimer.current)
    }
  }, [fetchUrl, sendTrack])

  if (loading) return (
    <div className="w-full aspect-video bg-black rounded-none lg:rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm">Video yuklanmoqda…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="w-full aspect-video bg-black rounded-none lg:rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-white/60 text-sm">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchUrl() }}
          className="px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 text-xs font-medium hover:bg-brand-600/30 transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    </div>
  )

  return (
    <div className="w-full aspect-video bg-black rounded-none lg:rounded-2xl overflow-hidden video-glow">
      <video
        ref={videoRef}
        key={signedUrl}
        src={signedUrl ?? undefined}
        controls
        preload="metadata"
        className="w-full h-full"
        title={title}
        onTimeUpdate={() => { watchedRef.current = Math.floor(videoRef.current?.currentTime ?? 0) }}
        onEnded={() => sendTrack(true)}
        onError={(e) => {
          const code = e.currentTarget.error?.code
          if (code === 2) setError('R2 dan video yuklab bo\'lmadi. CORS sozlamalarini tekshiring.')
          else if (code === 4) setError('Video formati qo\'llab-quvvatlanmaydi yoki fayl topilmadi.')
          else setError(`Video xatosi (kod ${code ?? '?'})`)
        }}
      />
    </div>
  )
}
