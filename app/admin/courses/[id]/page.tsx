'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  VideoOff,
  Video,
  BookOpen,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course, Lesson } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

/* ── helpers ──────────────────────────────────────────────────────── */

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/* ── types ────────────────────────────────────────────────────────── */

interface LessonFormState {
  title: string
  duration: string
  is_free: boolean
}

const EMPTY_FORM: LessonFormState = {
  title:    '',
  duration: '',
  is_free:  false,
}

/* ── framer variants ──────────────────────────────────────────────── */

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.045, duration: 0.25, ease: 'easeOut' },
  }),
}

/* ── upload state per lesson ──────────────────────────────────────── */

interface UploadState {
  lessonId: string
  progress: number          // 0-100
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
}

/* ══════════════════════════════════════════════════════════════════ */

export default function CourseLessonsPage() {
  const router   = useRouter()
  const params   = useParams()
  const courseId = params.id as string

  /* ── state ──────────────────────────────────────────────────────── */
  const [course,  setCourse]  = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editLesson,   setEditLesson]   = useState<Lesson | null>(null)
  const [form,         setForm]         = useState<LessonFormState>(EMPTY_FORM)
  const [submitting,   setSubmitting]   = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  /* upload states keyed by lessonId */
  const [uploads, setUploads] = useState<Record<string, UploadState>>({})

  /* hidden file inputs per lesson — we use a single ref map */
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  /* ── fetch course ────────────────────────────────────────────────── */
  const fetchCourse = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/courses?id=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data: Course = await res.json()
      setCourse(data)
    } catch {
      /* silent — title just won't show */
    }
  }, [courseId])

  /* ── fetch lessons ───────────────────────────────────────────────── */
  const fetchLessons = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/lessons?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setLessons(Array.isArray(json) ? json : (json.lessons ?? []))
    } catch (e: unknown) {
      toast((e as Error).message || 'Darslarni yuklashda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourse()
    fetchLessons()
  }, [fetchCourse, fetchLessons])

  /* ── open modals ─────────────────────────────────────────────────── */
  function openCreate() {
    setEditLesson(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(lesson: Lesson) {
    setEditLesson(lesson)
    setForm({
      title:    lesson.title,
      duration: lesson.duration ?? '',
      is_free:  lesson.is_free,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditLesson(null)
    setForm(EMPTY_FORM)
  }

  /* ── submit (create / edit lesson) ──────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast('Dars nomini kiriting', 'error'); return }

    setSubmitting(true)
    try {
      const token = await getToken()
      const body = {
        title:    form.title.trim(),
        duration: form.duration.trim() || null,
        is_free:  form.is_free,
        courseId,
      }

      if (editLesson) {
        const res = await fetch(`/api/admin/lessons?id=${editLesson.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
        toast('Dars yangilandi')
      } else {
        const res = await fetch('/api/admin/lessons', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
        toast('Yangi dars qo\'shildi')
      }

      closeModal()
      fetchLessons()
    } catch (e: unknown) {
      toast((e as Error).message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── delete lesson ───────────────────────────────────────────────── */
  async function handleDelete(lesson: Lesson) {
    if (!window.confirm(`"${lesson.title}" darsini o'chirmoqchimisiz?`)) return

    setDeletingId(lesson.id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/lessons?id=${lesson.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      toast('Dars o\'chirildi')
      fetchLessons()
    } catch (e: unknown) {
      toast((e as Error).message || 'Xatolik yuz berdi', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  /* ── trigger file input ──────────────────────────────────────────── */
  function triggerUpload(lessonId: string) {
    fileInputRefs.current[lessonId]?.click()
  }

  /* ── handle file selected → upload flow ─────────────────────────── */
  async function handleFileChange(lessonId: string, file: File | undefined) {
    if (!file) return

    setUploads((prev) => ({
      ...prev,
      [lessonId]: { lessonId, progress: 0, status: 'uploading' },
    }))

    try {
      const token = await getToken()

      // Fayl server orqali R2 ga yuklanadi (CORS muammosi bo'lmaydi)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('lessonId', lessonId)

      // Progress simulatsiya (server upload uchun real progress yo'q)
      const timer = setInterval(() => {
        setUploads((prev) => {
          const cur = prev[lessonId]?.progress ?? 0
          if (cur >= 90) { clearInterval(timer); return prev }
          return { ...prev, [lessonId]: { ...prev[lessonId], progress: cur + 5 } }
        })
      }, 300)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      clearInterval(timer)
      if (!res.ok) throw new Error(await res.text())

      setUploads((prev) => ({
        ...prev,
        [lessonId]: { lessonId, progress: 100, status: 'done' },
      }))
      toast('Video muvaffaqiyatli yuklandi')
      fetchLessons()

      /* clear done state after a few seconds */
      setTimeout(() => {
        setUploads((prev) => {
          const next = { ...prev }
          delete next[lessonId]
          return next
        })
      }, 4000)

    } catch (e: unknown) {
      const msg = (e as Error).message || 'Video yuklashda xatolik'
      setUploads((prev) => ({
        ...prev,
        [lessonId]: { lessonId, progress: 0, status: 'error', error: msg },
      }))
      toast(msg, 'error')
    }
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Back + Header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white
                     transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kurslar ro'yxatiga qaytish
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {course ? course.title : (
                <span className="inline-block w-48 h-5 rounded-lg bg-white/5 animate-pulse" />
              )}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              Darslarni boshqarish
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
                       text-white text-sm font-medium rounded-xl transition-colors shadow-lg
                       shadow-brand-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Dars qo'shish
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#080a18]">
        {/* Head */}
        <div className="grid grid-cols-[3rem_1fr_8rem_7rem_9rem_10rem] gap-4 px-4 py-3
                        border-b border-white/8 bg-white/[0.03]">
          {['Tartib', 'Dars nomi', 'Davomiyligi', 'Bepul?', 'Video holati', 'Amallar'].map((h) => (
            <span key={h} className="text-xs font-medium text-white/40 uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="w-10 h-10 text-white/10" />
            <p className="text-white/30 text-sm">Hali darslar yo'q</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible">
            <AnimatePresence mode="wait">
              {lessons.map((lesson, i) => {
                const upload = uploads[lesson.id]
                const isUploading = upload?.status === 'uploading'

                return (
                  <motion.div
                    key={lesson.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 last:border-0"
                  >
                    <div className="grid grid-cols-[3rem_1fr_8rem_7rem_9rem_10rem] gap-4
                                    px-4 py-3.5 hover:bg-white/[0.025] transition-colors">

                      {/* Order */}
                      <span className="text-sm text-white/30 self-center font-mono">
                        {lesson.order_index}
                      </span>

                      {/* Title */}
                      <span className="text-sm text-white font-medium self-center truncate">
                        {lesson.title}
                      </span>

                      {/* Duration */}
                      <span className="text-sm text-white/50 self-center font-mono">
                        {lesson.duration ?? '—'}
                      </span>

                      {/* is_free */}
                      <div className="self-center">
                        {lesson.is_free ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                           bg-emerald-500/10 text-emerald-400 text-xs font-medium
                                           border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Bepul
                          </span>
                        ) : (
                          <span className="text-xs text-white/25">—</span>
                        )}
                      </div>

                      {/* Video status */}
                      <div className="self-center">
                        {lesson.video_key ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                           bg-emerald-500/10 text-emerald-400 text-xs font-medium
                                           border border-emerald-500/20">
                            <Video className="w-3 h-3" />
                            Yuklangan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                           bg-white/5 text-white/35 text-xs font-medium
                                           border border-white/10">
                            <VideoOff className="w-3 h-3" />
                            Yuklanmagan
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 self-center">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(lesson)}
                          title="Tahrirlash"
                          className="p-1.5 rounded-lg text-white/40 hover:text-brand-400
                                     hover:bg-brand-400/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(lesson)}
                          disabled={deletingId === lesson.id}
                          title="O'chirish"
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400
                                     hover:bg-red-400/10 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Upload video */}
                        <button
                          onClick={() => triggerUpload(lesson.id)}
                          disabled={isUploading}
                          title="Video yuklash"
                          className="p-1.5 rounded-lg text-white/40 hover:text-amber-400
                                     hover:bg-amber-400/10 transition-colors disabled:opacity-40"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>

                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[lesson.id] = el }}
                          onChange={(e) => handleFileChange(lesson.id, e.target.files?.[0])}
                          /* reset value so same file can be re-selected */
                          onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                        />
                      </div>
                    </div>

                    {/* Upload progress bar */}
                    <AnimatePresence>
                      {upload && upload.status !== 'idle' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-white/40">
                                {upload.status === 'uploading' && `Yuklanmoqda… ${upload.progress}%`}
                                {upload.status === 'done'      && 'Yuklash yakunlandi'}
                                {upload.status === 'error'     && (upload.error ?? 'Xatolik')}
                              </span>
                              <span className="text-xs font-mono text-white/30">
                                {upload.status === 'uploading' ? `${upload.progress}%` : ''}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                animate={{ width: `${upload.progress}%` }}
                                transition={{ ease: 'easeOut', duration: 0.3 }}
                                className={`h-full rounded-full transition-colors ${
                                  upload.status === 'error'
                                    ? 'bg-red-500'
                                    : upload.status === 'done'
                                    ? 'bg-emerald-500'
                                    : 'bg-brand-500'
                                }`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Create / Edit Lesson Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editLesson ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Dars nomi <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: O'zgaruvchilar va ma'lumot turlari"
              required
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                         text-sm text-white placeholder:text-white/25 outline-none
                         focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Davomiyligi
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="22:14"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                         text-sm text-white placeholder:text-white/25 outline-none font-mono
                         focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {/* is_free */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 rounded-full bg-white/10 border border-white/10 peer-checked:bg-brand-600
                              peer-checked:border-brand-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/40 shadow
                              peer-checked:translate-x-5 peer-checked:bg-white transition-transform" />
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors select-none">
              Bepul dars
            </span>
          </label>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm
                         text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500
                         text-sm text-white font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? (editLesson ? 'Saqlanmoqda…' : 'Qo\'shilmoqda…')
                : (editLesson ? 'Saqlash'       : 'Qo\'shish')
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
