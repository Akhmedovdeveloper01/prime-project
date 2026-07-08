'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BadgeDollarSign,
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

type PaymentStatus = 'pending' | 'paid' | 'rejected'

type Payment = {
  id: string
  user_id: string
  course_id: string
  amount: number
  status: PaymentStatus
  created_at: string
  profiles: { full_name: string | null; email: string | null }
  courses: { title: string }
}

type ApiResponse = {
  data: Payment[]
  total: number
  page: number
  pageSize: number
}

const STATUS_TABS: { label: string; value: PaymentStatus | '' }[] = [
  { label: 'Barchasi',      value: '' },
  { label: 'Kutilmoqda',    value: 'pending' },
  { label: "To'langan",     value: 'paid' },
  { label: 'Rad etilgan',   value: 'rejected' },
]

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

function formatAmount(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: {
      label: 'Kutilmoqda',
      icon: Clock,
      className: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20',
    },
    paid: {
      label: "To'langan",
      icon: CheckCircle2,
      className: 'bg-green-500/12 text-green-400 border-green-500/20',
    },
    rejected: {
      label: 'Rad etilgan',
      icon: XCircle,
      className: 'bg-red-500/12 text-red-400 border-red-500/20',
    },
  } as const

  const { label, icon: Icon, className } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments]   = useState<Payment[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [pageSize]                = useState(15)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('')
  const [loading, setLoading]     = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  /* ── Fetch payments ─────────────────────────────────────── */
  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("To'lovlarni yuklashda xatolik")

      const json: ApiResponse = await res.json()
      setPayments(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  /* ── Handle status change ───────────────────────────────── */
  async function handleAction(payment: Payment, newStatus: 'paid' | 'rejected') {
    setActioning(`${payment.id}-${newStatus}`)
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/payments?id=${payment.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("To'lov holatini yangilashda xatolik")

      if (newStatus === 'paid') {
        toast("To'lov tasdiqlandi, foydalanuvchi faollashtirildi", 'success')
      } else {
        toast("To'lov rad etildi", 'error')
      }

      fetchPayments()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setActioning(null)
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
          <h1 className="text-xl font-semibold text-white">To&apos;lovlar</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Jami: <span className="text-white/60 font-medium">{total}</span> ta to&apos;lov
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Yangilash
        </button>
      </motion.div>

      {/* Status tabs */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/6 w-fit overflow-x-auto"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${statusFilter === tab.value
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-white/40 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
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
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <BadgeDollarSign className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">To&apos;lovlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['№', 'Foydalanuvchi', 'Kurs', 'Summa', 'Sana', 'Status', 'Amallar'].map(
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
                {payments.map((payment, idx) => (
                  <tr
                    key={payment.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* № */}
                    <td className="px-4 py-3.5 text-white/30 tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {/* Foydalanuvchi */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-white font-medium">
                          {payment.profiles?.full_name ?? (
                            <span className="text-white/25 italic">Nomsiz</span>
                          )}
                        </p>
                        <p className="text-white/35 text-xs mt-0.5">
                          {payment.profiles?.email ?? '—'}
                        </p>
                      </div>
                    </td>

                    {/* Kurs */}
                    <td className="px-4 py-3.5">
                      <span className="text-white/70 max-w-[180px] truncate block">
                        {payment.courses?.title ?? '—'}
                      </span>
                    </td>

                    {/* Summa */}
                    <td className="px-4 py-3.5 text-white/70 tabular-nums whitespace-nowrap">
                      {formatAmount(payment.amount)}
                    </td>

                    {/* Sana */}
                    <td className="px-4 py-3.5 text-white/40 tabular-nums whitespace-nowrap">
                      {formatDate(payment.created_at)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={payment.status} />
                    </td>

                    {/* Amallar */}
                    <td className="px-4 py-3.5">
                      {payment.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          {/* Tasdiqlash */}
                          <button
                            onClick={() => handleAction(payment, 'paid')}
                            disabled={actioning !== null}
                            className="
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                              bg-green-500/10 text-green-400 hover:bg-green-500/20
                              border border-green-500/20 hover:border-green-500/35
                              disabled:opacity-40 disabled:cursor-not-allowed
                              transition-all
                            "
                          >
                            {actioning === `${payment.id}-paid` ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Tasdiqlash
                          </button>

                          {/* Rad etish */}
                          <button
                            onClick={() => handleAction(payment, 'rejected')}
                            disabled={actioning !== null}
                            className="
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                              bg-red-500/10 text-red-400 hover:bg-red-500/20
                              border border-red-500/20 hover:border-red-500/35
                              disabled:opacity-40 disabled:cursor-not-allowed
                              transition-all
                            "
                          >
                            {actioning === `${payment.id}-rejected` ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Rad etish
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs italic">—</span>
                      )}
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
    </div>
  )
}
