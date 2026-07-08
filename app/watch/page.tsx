'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import VideoPlayer from '@/components/VideoPlayer'
import { supabase, type Lesson, type Course } from '@/lib/supabase'
import { CheckCircle2, Lock, Play, ChevronRight, Clock, Award, BookOpen, ShieldAlert } from 'lucide-react'

function WatchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [watchTime, setWatchTime] = useState(0)
  const [showCert, setShowCert] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPaid, setIsPaid] = useState<boolean | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auth tekshiruvi + ma'lumotlar yuklash
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/watch'); return }

      // is_paid va role tekshiruvi
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_paid, role')
        .eq('id', session.user.id)
        .maybeSingle()

      const paid = profile?.is_paid === true || profile?.role === 'admin'
      setIsPaid(paid)
      if (!paid) { setLoading(false); return }

      if (!courseId) {
        // courseId yo'q — birinchi kursni olamiz
        const { data: firstCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('is_published', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (firstCourse) {
          router.replace(`/watch?courseId=${firstCourse.id}`)
        } else {
          setLoading(false)
        }
        return
      }

      // Kurs va darslarni DB dan olamiz
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle()

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (coursesData) setCourse(coursesData)
      if (lessonsData?.length) {
        // Takroriy IDlarni olib tashlaymiz
        const unique = lessonsData.filter(
          (l, i, arr) => arr.findIndex(x => x.id === l.id) === i
        )
        setLessons(unique)
        setActiveId(unique[0].id)
      }
      setLoading(false)
    }
    init()
  }, [router, courseId])

  // Seans vaqti
  useEffect(() => {
    intervalRef.current = setInterval(() => setWatchTime(t => t + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const activeLesson = lessons.find(l => l.id === activeId)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isPaid === false) {
    return (
      <div className="min-h-screen bg-[#05060f] text-white">
        <Navbar />
        <div className="pt-16 min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Ruxsat kutilmoqda</h1>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Kursga kirish uchun to&apos;lov tasdiqlangan bo&apos;lishi kerak.
              Admin siz uchun parol yaratib beradi va email orqali xabar qiladi.
            </p>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05060f] text-white">
      <Navbar />
      <div className="pt-16 min-h-screen flex flex-col">

        {/* Top bar */}
        <div className="border-b border-white/5 bg-[#08090f] px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">{course?.title ?? 'Kurs'}</span>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <span className="text-sm text-white/80 font-medium truncate max-w-xs">
                {activeLesson?.title ?? ''}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <Clock className="w-3.5 h-3.5" />
                <span>Bu seans: {fmt(watchTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-0 lg:px-6 gap-0 lg:gap-6 py-0 lg:py-6">

          {/* Video area */}
          <div className="flex-1 flex flex-col gap-4">
            {activeId && (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <VideoPlayer
                  lessonId={activeId}
                  title={activeLesson?.title}
                  totalSeconds={activeLesson?.duration
                    ? (() => {
                        const [m, s] = activeLesson.duration!.split(':').map(Number)
                        return (m || 0) * 60 + (s || 0)
                      })()
                    : 0
                  }
                />
              </motion.div>
            )}

            {/* Video info */}
            {activeLesson && (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 lg:px-0"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h1 className="text-xl font-semibold text-white mb-1">{activeLesson.title}</h1>
                    <p className="text-sm text-white/40">{course?.title} · {activeLesson.duration ?? ''}</p>
                  </div>
                  <button
                    onClick={() => setShowCert(true)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    <Award className="w-4 h-4" /> Sertifikat
                  </button>
                </div>

                <div className="p-4 rounded-xl glass border border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Jami darslar', value: `${lessons.length} ta`, icon: BookOpen },
                      { label: 'Seans vaqti', value: fmt(watchTime), icon: Clock },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-white/3">
                        <p className="text-base font-semibold text-white">{item.value}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Lessons sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-20 glass lg:rounded-2xl border-t lg:border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Darslar ro'yxati</span>
                <span className="text-xs text-white/30">{lessons.length} ta dars</span>
              </div>
              <div className="max-h-[60vh] lg:max-h-[70vh] overflow-y-auto">
                {lessons.map((lesson, i) => {
                  const accessible = lesson.is_free || activeId === lesson.id
                  return (
                    <motion.button
                      key={lesson.id}
                      onClick={() => accessible && setActiveId(lesson.id)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/3 transition-all duration-200 ${
                        activeId === lesson.id
                          ? 'bg-brand-600/15 border-l-2 border-l-brand-500'
                          : 'hover:bg-white/3'
                      } ${!accessible ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        activeId === lesson.id
                          ? 'bg-brand-600 text-white'
                          : lesson.is_free
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-white/30'
                      }`}>
                        {!accessible
                          ? <Lock className="w-3 h-3" />
                          : <Play className="w-3 h-3 fill-current" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug truncate ${activeId === lesson.id ? 'text-white' : 'text-white/60'}`}>
                          {i + 1}. {lesson.title}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5">{lesson.duration ?? ''}</p>
                      </div>
                      {lesson.is_free && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex-shrink-0">Bepul</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate modal */}
      <AnimatePresence>
        {showCert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCert(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-8 border border-white/10 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sertifikat olish</h2>
              <p className="text-white/40 text-sm mb-6">Barcha darslarni tugatgandan so'ng sertifikat olishingiz mumkin.</p>
              <button
                onClick={() => setShowCert(false)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
              >
                Yopish
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense>
      <WatchContent />
    </Suspense>
  )
}
