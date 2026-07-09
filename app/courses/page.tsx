'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Clock, BookOpen, Play, CheckCircle2 } from 'lucide-react'
import { supabase, type Course } from '@/lib/supabase'

type CourseWithLessons = Course & { lessons: { count: number }[] }

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
    })

    supabase
      .from('courses')
      .select('*, lessons(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCourses((data as CourseWithLessons[]) ?? [])
        setLoading(false)
      })
  }, [])

  const startHref = loggedIn ? '/watch' : '/login?redirect=/watch'

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <Navbar />

      {/* Header */}
      <div className="relative pt-28 pb-16 px-4 sm:px-6">
        <div className="orb w-[500px] h-[300px] bg-brand-600/10 top-0 right-0" />
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-brand-400 text-sm font-medium uppercase tracking-widest">Barcha kurslar</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              O&apos;z yo&apos;lingizni <span className="gradient-text">tanlang</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg">
              Har bir kurs amaliy topshiriqlar, real misollar va sertifikat bilan birga keladi.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 text-white/30">Hozircha kurslar yo&apos;q</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course, i) => {
              const lessonCount = course.lessons?.[0]?.count ?? 0
              const price = course.price === 0 ? 'Bepul' : `${course.price.toLocaleString()} so'm`

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl border border-white/10 glass overflow-hidden group transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                        📚
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {course.tag && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-600/15 text-brand-300">
                              {course.tag}
                            </span>
                          )}
                          {course.price === 0 && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              Bepul
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-semibold text-white leading-snug">{course.title}</h2>
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-sm text-white/40 leading-relaxed mb-5">{course.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-white/30 mb-5 pb-5 border-b border-white/5">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />{lessonCount} dars
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{price}</span>
                      <Link
                        href={
                          loggedIn
                            ? `/watch?courseId=${course.id}`
                            : `/login?redirect=${encodeURIComponent(`/watch?courseId=${course.id}`)}`
                        }
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 hover:-translate-y-0.5"
                      >
                        <Play className="w-4 h-4 fill-white" /> Boshlash
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
