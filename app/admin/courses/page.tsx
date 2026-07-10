'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

/* ── helpers ──────────────────────────────────────────────────────── */

function formatPrice(price: number) {
  return price.toLocaleString('uz-UZ') + ' so\'m'
}

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

/* ── types ────────────────────────────────────────────────────────── */

interface CourseFormState {
  title: string
  description: string
  price: string
  tag: string
}

const EMPTY_FORM: CourseFormState = {
  title: '',
  description: '',
  price: '',
  tag: '',
}

const PAGE_SIZE = 10

/* ── framer variants ──────────────────────────────────────────────── */

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' },
  }),
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

/* ══════════════════════════════════════════════════════════════════ */

export default function CoursesPage() {
  const router = useRouter()

  /* ── state ──────────────────────────────────────────────────────── */
  const [courses, setCourses]       = useState<Course[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)

  const [modalOpen, setModalOpen]   = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [form, setForm]             = useState<CourseFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ── fetch ──────────────────────────────────────────────────────── */
  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setCourses(Array.isArray(json) ? json : (json.courses ?? []))
    } catch (e: unknown) {
      toast((e as Error).message || 'Kurslarni yuklashda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  /* ── derived ────────────────────────────────────────────────────── */
  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* reset page when search changes */
  useEffect(() => { setPage(1) }, [search])

  /* ── open modals ────────────────────────────────────────────────── */
  function openCreate() {
    setEditCourse(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(course: Course, e: React.MouseEvent) {
    e.stopPropagation()
    setEditCourse(course)
    setForm({
      title:       course.title,
      description: course.description ?? '',
      price:       course.price.toString(),
      tag:         course.tag ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditCourse(null)
    setForm(EMPTY_FORM)
  }

  /* ── submit (create / edit) ─────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast('Kurs nomini kiriting', 'error'); return }

    setSubmitting(true)
    try {
      const token = await getToken()
      const body = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        price:       Number(form.price) || 0,
        tag:         form.tag.trim() || null,
      }

      if (editCourse) {
        const res = await fetch(`/api/admin/courses?id=${editCourse.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
        toast('Kurs yangilandi')
      } else {
        const res = await fetch('/api/admin/courses', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
        toast('Yangi kurs yaratildi')
      }

      closeModal()
      fetchCourses()
    } catch (e: unknown) {
      toast((e as Error).message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── publish toggle ─────────────────────────────────────────────── */
  async function handleToggle(course: Course, e: React.MouseEvent) {
    e.stopPropagation()
    setTogglingId(course.id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/courses?id=${course.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ is_published: !course.is_published }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast(course.is_published ? 'Kurs yashirildi' : 'Kurs chop etildi')
      fetchCourses()
    } catch (e: unknown) {
      toast((e as Error).message || 'Xatolik yuz berdi', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  /* ── delete ─────────────────────────────────────────────────────── */
  async function handleDelete(course: Course, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`"${course.title}" kursini o'chirmoqchimisiz?`)) return

    setDeletingId(course.id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/courses?id=${course.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      toast('Kurs o\'chirildi')
      fetchCourses()
    } catch (e: unknown) {
      toast((e as Error).message || 'Xatolik yuz berdi', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Kurslar boshqaruvi</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Jami {courses.length} ta kurs
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500
                     text-white text-sm font-medium rounded-xl transition-colors shadow-lg
                     shadow-brand-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yangi kurs qo'shish
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kurs nomini qidiring..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                     text-sm text-white placeholder:text-white/30 outline-none
                     focus:border-brand-500/50 focus:bg-white/[0.07] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden bg-[var(--bg-sidebar)]">
        {/* Table head */}
        <div className="grid grid-cols-[2rem_1fr_9rem_8rem_7rem_8rem] gap-4 px-4 py-3
                        border-b border-white/8 bg-white/[0.03]">
          {['№', 'Kurs nomi', 'Narx (so\'m)', 'Darslar soni', 'Status', 'Amallar'].map((h) => (
            <span key={h} className="text-xs font-medium text-white/40 uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="w-10 h-10 text-white/10" />
            <p className="text-white/30 text-sm">
              {search ? 'Qidiruv natijasi topilmadi' : 'Hali kurslar yo\'q'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {paginated.map((course, i) => (
                <motion.div
                  key={course.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  onClick={() => router.push(`/admin/courses/${course.id}`)}
                  className="grid grid-cols-[2rem_1fr_9rem_8rem_7rem_8rem] gap-4 px-4 py-3.5
                             border-b border-white/5 last:border-0 hover:bg-white/[0.03]
                             cursor-pointer transition-colors group"
                >
                  {/* № */}
                  <span className="text-sm text-white/30 self-center">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </span>

                  {/* Title */}
                  <div className="self-center min-w-0">
                    <p className="text-sm text-white font-medium truncate group-hover:text-brand-300 transition-colors">
                      {course.title}
                    </p>
                    {course.tag && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md
                                       bg-brand-950/60 text-brand-400 text-[10px] font-medium border
                                       border-brand-800/40">
                        {course.tag}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <span className="text-sm text-white/70 self-center">
                    {formatPrice(course.price)}
                  </span>

                  {/* Lessons count — fetched via course object if available */}
                  <span className="text-sm text-white/50 self-center">
                    —
                  </span>

                  {/* Status */}
                  <div className="self-center">
                    {course.is_published ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-emerald-500/10 text-emerald-400 text-xs font-medium
                                       border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Chop etilgan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-white/5 text-white/40 text-xs font-medium
                                       border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        Qoralama
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Publish toggle */}
                    <button
                      onClick={(e) => handleToggle(course, e)}
                      disabled={togglingId === course.id}
                      title={course.is_published ? 'Yashirish' : 'Chop etish'}
                      className="p-1.5 rounded-lg text-white/40 hover:text-amber-400
                                 hover:bg-amber-400/10 transition-colors disabled:opacity-40"
                    >
                      {course.is_published
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye    className="w-3.5 h-3.5" />
                      }
                    </button>

                    {/* Edit */}
                    <button
                      onClick={(e) => openEdit(course, e)}
                      title="Tahrirlash"
                      className="p-1.5 rounded-lg text-white/40 hover:text-brand-400
                                 hover:bg-brand-400/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(course, e)}
                      disabled={deletingId === course.id}
                      title="O'chirish"
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400
                                 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} ta
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5
                         transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                  ${page === p
                    ? 'bg-brand-600 text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5
                         transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editCourse ? 'Kursni tahrirlash' : 'Yangi kurs qo\'shish'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Kurs nomi <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: Python dasturlash asoslari"
              required
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                         text-sm text-white placeholder:text-white/25 outline-none
                         focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Tavsif
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kurs haqida qisqacha ma'lumot..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                         text-sm text-white placeholder:text-white/25 outline-none resize-none
                         focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {/* Price + Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Narx (so'm)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-sm text-white placeholder:text-white/25 outline-none
                           focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Teg
              </label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                placeholder="SCOPUS, PhD, ..."
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-sm text-white placeholder:text-white/25 outline-none
                           focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors"
              />
            </div>
          </div>

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
                ? (editCourse ? 'Saqlanmoqda…' : 'Qo\'shilmoqda…')
                : (editCourse ? 'Saqlash'      : 'Qo\'shish')
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
