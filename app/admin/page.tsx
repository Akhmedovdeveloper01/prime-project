'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  DollarSign,
  CheckCircle2,
  BookOpen,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Payment } from '@/lib/supabase'

/* ── Types ──────────────────────────────────────────────── */
interface Stats {
  totalUsers:   number
  todayNew:     number
  totalRevenue: number
  paidUsers:    number
}

interface PaymentRow extends Payment {
  profiles?: { full_name: string | null; email: string | null }
  courses?:  { title: string }
}

/* ── Helpers ────────────────────────────────────────────── */
function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const STATUS_STYLES: Record<string, string> = {
  paid:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
  rejected: 'bg-red-500/10   text-red-400    border-red-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  paid:     "To'langan",
  pending:  'Kutilmoqda',
  rejected: 'Rad etilgan',
}

/* ── Stat card data ─────────────────────────────────────── */
const STAT_META = [
  {
    key:   'totalUsers',
    label: 'Jami foydalanuvchilar',
    desc:  'Ro\'yxatdan o\'tgan',
    icon:  Users,
    color: 'text-brand-400',
    bg:    'bg-brand-600/10',
  },
  {
    key:   'todayNew',
    label: 'Bugungi yangilar',
    desc:  'Bugun qo\'shilgan',
    icon:  UserPlus,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10',
  },
  {
    key:   'totalRevenue',
    label: "Jami daromad (so'm)",
    desc:  "Barcha to'lovlar",
    icon:  DollarSign,
    color: 'text-violet-400',
    bg:    'bg-violet-500/10',
    money: true,
  },
  {
    key:   'paidUsers',
    label: "To'lagan foydalanuvchilar",
    desc:  'Faol obunachi',
    icon:  CheckCircle2,
    color: 'text-sky-400',
    bg:    'bg-sky-500/10',
  },
] satisfies Array<{ key: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; money?: boolean }>

const QUICK_LINKS = [
  { label: 'Yangi kurs qo\'shish',    href: '/admin/courses/new',  icon: BookOpen  },
  { label: "To'lovlarni ko'rish",     href: '/admin/payments',     icon: CreditCard },
  { label: 'Foydalanuvchilar ro\'yxati', href: '/admin/users',     icon: Users     },
  { label: 'Analitika',               href: '/admin/analytics',    icon: TrendingUp },
]

/* ── Animation variants ─────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

/* ── Component ──────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const router = useRouter()

  const [userEmail,  setUserEmail]  = useState<string | null>(null)
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [payments,   setPayments]   = useState<PaymentRow[]>([])
  const [loadStats,  setLoadStats]  = useState(true)
  const [loadPay,    setLoadPay]    = useState(true)

  /* ── Fetch session + data ─────────────────────────────── */
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setUserEmail(session.user.email ?? null)
      const token = session.access_token

      /* Stats */
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          setStats(json)
        } else {
          // Fallback: query supabase directly (relies on RLS being permissive for admin)
          await fetchStatsDirect(session.user.id, token)
        }
      } catch {
        await fetchStatsDirect(session.user.id, token)
      } finally {
        setLoadStats(false)
      }

      /* Recent payments */
      try {
        const res = await fetch('/api/admin/payments?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          setPayments(json.payments ?? json)
        } else {
          await fetchPaymentsDirect()
        }
      } catch {
        await fetchPaymentsDirect()
      } finally {
        setLoadPay(false)
      }
    }

    load()
  }, [router])

  async function fetchStatsDirect(_userId: string, _token: string) {
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalUsers },
      { count: todayNew },
      { count: paidUsers },
      { data: payData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_paid', true),
      supabase.from('payments').select('amount').eq('status', 'paid'),
    ])

    const totalRevenue = (payData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

    setStats({
      totalUsers:   totalUsers   ?? 0,
      todayNew:     todayNew     ?? 0,
      paidUsers:    paidUsers    ?? 0,
      totalRevenue,
    })
  }

  async function fetchPaymentsDirect() {
    const { data } = await supabase
      .from('payments')
      .select('*, profiles(full_name, email), courses(title)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setPayments(data as PaymentRow[])
  }

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-1"
      >
        <p className="text-white/40 text-sm flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-white">
          Xush kelibsiz,{' '}
          <span className="text-brand-400">{userEmail ?? '…'}</span>
        </h1>
      </motion.div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {STAT_META.map(({ key, label, desc, icon: Icon, color, bg, money }) => (
          <motion.div
            key={key}
            variants={cardVariants}
            className="relative bg-[#080a18] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-colors"
          >
            {/* Glow accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3 flex-1 min-w-0">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
                {loadStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold text-white tabular-nums">
                    {money
                      ? formatMoney(stats?.[key as keyof Stats] ?? 0)
                      : (stats?.[key as keyof Stats] ?? 0).toLocaleString()
                    }
                  </p>
                )}
                <p className="text-white/30 text-xs">{desc}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Bottom grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent payments table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="lg:col-span-2 bg-[#080a18] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white text-sm">So'nggi to'lovlar</h2>
            <Link
              href="/admin/payments"
              className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
            >
              Barchasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadPay ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CreditCard className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">To'lovlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-white/30 font-medium text-xs px-5 py-2.5">Foydalanuvchi</th>
                    <th className="text-left text-white/30 font-medium text-xs px-5 py-2.5">Kurs</th>
                    <th className="text-left text-white/30 font-medium text-xs px-5 py-2.5">Summa</th>
                    <th className="text-left text-white/30 font-medium text-xs px-5 py-2.5">Status</th>
                    <th className="text-left text-white/30 font-medium text-xs px-5 py-2.5">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-white/70 max-w-[140px] truncate">
                        {p.profiles?.full_name ?? p.profiles?.email ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-white/50 max-w-[140px] truncate">
                        {p.courses?.title ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium tabular-nums whitespace-nowrap">
                        {formatMoney(p.amount)} so'm
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[p.status] ?? ''}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40 whitespace-nowrap text-xs">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.38 }}
          className="bg-[#080a18] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white text-sm">Tezkor havolalar</h2>
          </div>

          <div className="p-3 space-y-1">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="
                  flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/60
                  hover:text-white hover:bg-white/5 transition-all duration-150 group
                "
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-600/20 transition-colors">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="flex-1">{label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all duration-150" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
