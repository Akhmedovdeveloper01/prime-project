'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  UserCheck,
  UserX,
  UserPlus,
  X,
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'student' | 'admin'
  is_paid: boolean
  created_at: string
}

type ApiResponse = {
  data: Profile[]
  total: number
  page: number
  pageSize: number
}

const FILTER_OPTIONS = [
  { label: 'Barchasi',   value: '' },
  { label: "To'lagan",   value: 'paid' },
  { label: "To'lamagan", value: 'unpaid' },
] as const

type FilterValue = '' | 'paid' | 'unpaid'

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function UsersPage() {
  const [users, setUsers]           = useState<Profile[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pageSize]                  = useState(15)
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter]         = useState<FilterValue>('')
  const [loading, setLoading]       = useState(true)
  const [toggling, setToggling]     = useState<string | null>(null)

  // Create user modal
  const [showModal, setShowModal]   = useState(false)
  const [creating, setCreating]     = useState(false)
  const [newEmail, setNewEmail]     = useState('')
  const [newName, setNewName]       = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newIsPaid, setNewIsPaid]   = useState(true)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Debounce search ────────────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  /* ── Fetch users ────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filter)          params.set('filter', filter)

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Foydalanuvchilarni yuklashda xatolik')

      const json: ApiResponse = await res.json()
      setUsers(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  /* ── Toggle is_paid ─────────────────────────────────────── */
  async function handleTogglePaid(user: Profile) {
    setToggling(user.id)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_paid: !user.is_paid }),
      })

      if (!res.ok) throw new Error("To'lov holatini yangilashda xatolik")

      toast(
        !user.is_paid
          ? `${user.full_name ?? 'Foydalanuvchi'} faollashtirildi`
          : `${user.full_name ?? 'Foydalanuvchi'} to'lovi bekor qilindi`,
        'success'
      )
      fetchUsers()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setToggling(null)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, is_paid: newIsPaid }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Xatolik')
      toast(`${newName || newEmail} qo'shildi`, 'success')
      setShowModal(false)
      setNewEmail(''); setNewName(''); setNewPassword(''); setNewIsPaid(true)
      fetchUsers()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Foydalanuvchilar</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Jami: <span className="text-white/60 font-medium">{total}</span> ta foydalanuvchi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Yangilash
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Foydalanuvchi qo&apos;shish
          </button>
        </div>
      </motion.div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki email bo'yicha qidirish…"
            className="
              w-full pl-9 pr-4 py-2.5 rounded-xl
              bg-white/5 border border-white/8
              text-white text-sm placeholder:text-white/25
              focus:outline-none focus:border-brand-600/60 focus:bg-white/8
              transition-all
            "
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as FilterValue); setPage(1) }}
            className="
              appearance-none pl-9 pr-8 py-2.5 rounded-xl
              bg-white/5 border border-white/8
              text-white text-sm
              focus:outline-none focus:border-brand-600/60
              transition-all cursor-pointer
            "
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--bg-dropdown)]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 rotate-90 pointer-events-none" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden"
      >
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">Foydalanuvchi topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['№', 'Ism', 'Email', 'Role', "Ro'yxatdan o'tgan", "To'lov holati", 'Amallar'].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-white/35 font-medium text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* № */}
                    <td className="px-4 py-3.5 text-white/30 tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {/* Ism */}
                    <td className="px-4 py-3.5">
                      <span className="text-white font-medium">
                        {user.full_name ?? <span className="text-white/25 italic">Nomsiz</span>}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-white/50">
                      {user.email ?? '—'}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-600/15 text-brand-300 text-xs font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 text-white/40 text-xs font-medium">
                          Student
                        </span>
                      )}
                    </td>

                    {/* Ro'yxatdan o'tgan */}
                    <td className="px-4 py-3.5 text-white/40 tabular-nums whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>

                    {/* To'lov holati */}
                    <td className="px-4 py-3.5">
                      {user.is_paid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/12 text-green-400 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          To&apos;lagan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 text-white/40 text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          To&apos;lamagan
                        </span>
                      )}
                    </td>

                    {/* Amallar */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleTogglePaid(user)}
                        disabled={toggling === user.id}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                          transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          ${user.is_paid
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                            : 'bg-brand-600/15 text-brand-300 hover:bg-brand-600/25 border border-brand-600/25'
                          }
                        `}
                      >
                        {toggling === user.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : user.is_paid ? (
                          <UserX className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        {user.is_paid ? 'Bekor qilish' : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-white/30">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                bg-white/5 hover:bg-white/10 text-white/50 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all
              "
            >
              <ChevronLeft className="w-4 h-4" />
              Oldingi
            </button>

            <span className="px-3 py-2 rounded-lg bg-brand-600/15 text-brand-300 text-sm font-medium border border-brand-600/25 tabular-nums">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                bg-white/5 hover:bg-white/10 text-white/50 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all
              "
            >
              Keyingi
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Create user modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-dropdown)] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Yangi foydalanuvchi</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Ism va familiya</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Aziz Karimov"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Parol * (kamida 6 ta belgi)</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Parol yarating"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 font-mono tracking-wider"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setNewIsPaid(!newIsPaid)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${newIsPaid ? 'bg-brand-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${newIsPaid ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-white/60">To&apos;lov tasdiqlangan (darsga kirish bor)</span>
              </label>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-all"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium transition-all"
                >
                  {creating ? 'Yaratilmoqda…' : 'Yaratish'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
