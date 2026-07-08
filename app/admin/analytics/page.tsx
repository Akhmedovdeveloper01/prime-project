'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Clock, TrendingUp, BookOpen, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ── Types ──────────────────────────────────────────────────── */
type WeeklyPoint = {
  day: string
  count: number
}

type CourseCompletion = {
  title: string
  rate: number
}

type StatCards = {
  totalHours: number
  avgCompletion: number
  topCourse: string
  todayViews: number
}

/* ── Uzbek weekday labels ───────────────────────────────────── */
const UZ_DAYS = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha']

function getWeekdayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return UZ_DAYS[d.getDay()]
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

/* ── Skeleton ───────────────────────────────────────────────── */
function ChartSkeleton() {
  return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/8" />
      <div className="h-7 w-32 rounded bg-white/10" />
    </div>
  )
}

/* ── Tooltip contentStyle ───────────────────────────────────── */
const tooltipStyle = {
  background: '#0c0d1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
}

/* ── Stat card ──────────────────────────────────────────────── */
type StatCardProps = {
  label: string
  value: string | number
  icon: React.ElementType
  delay?: number
  sub?: string
}

function StatCard({ label, value, icon: Icon, delay = 0, sub }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="rounded-xl border border-white/8 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-semibold text-white mt-1.5 tabular-nums truncate">{value}</p>
          {sub && <p className="text-white/30 text-xs mt-1 truncate">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [stats, setStats]               = useState<StatCards | null>(null)
  const [weeklyData, setWeeklyData]     = useState<WeeklyPoint[]>([])
  const [completionData, setCompletionData] = useState<CourseCompletion[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const last7 = getLast7Days()
        const startDate = last7[0]

        /* ── 1. Weekly watch history ── */
        const { data: weeklyRaw, error: weeklyErr } = await supabase
          .from('watch_history')
          .select('last_watched_at')
          .gte('last_watched_at', startDate + 'T00:00:00')
          .order('last_watched_at', { ascending: true })

        if (weeklyErr) throw weeklyErr

        const countByDay: Record<string, number> = {}
        for (const day of last7) countByDay[day] = 0
        for (const row of weeklyRaw ?? []) {
          const day = (row.last_watched_at as string).split('T')[0]
          if (day in countByDay) countByDay[day]++
        }
        const weekly: WeeklyPoint[] = last7.map((day) => ({
          day: getWeekdayLabel(day),
          count: countByDay[day],
        }))
        setWeeklyData(weekly)

        /* ── 2. Course completion rate ── */
        const { data: historyRaw, error: histErr } = await supabase
          .from('watch_history')
          .select('completed, lessons(course_id, courses(title))')

        if (histErr) throw histErr

        type LessonJoin = {
          course_id: string
          courses: { title: string } | null
        }
        type HistoryRow = {
          completed: boolean
          lessons: LessonJoin | null
        }

        const courseMap: Record<string, { title: string; total: number; completed: number }> = {}
        for (const row of (historyRaw as unknown as HistoryRow[] ?? [])) {
          const lesson = row.lessons
          if (!lesson) continue
          const courseId = lesson.course_id
          const title = lesson.courses?.title ?? 'Nomsiz kurs'
          if (!courseMap[courseId]) courseMap[courseId] = { title, total: 0, completed: 0 }
          courseMap[courseId].total++
          if (row.completed) courseMap[courseId].completed++
        }
        const completion: CourseCompletion[] = Object.values(courseMap)
          .map((c) => ({
            title: c.title.length > 22 ? c.title.slice(0, 22) + '…' : c.title,
            rate: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
          }))
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 8)
        setCompletionData(completion)

        /* ── 3. Stat cards ── */
        // Total hours watched (sum of watched_seconds / 3600)
        const { data: hoursRaw } = await supabase
          .from('watch_history')
          .select('watched_seconds')
        const totalSeconds = (hoursRaw ?? []).reduce(
          (acc: number, r: { watched_seconds: number | null }) => acc + (r.watched_seconds ?? 0),
          0
        )
        const totalHours = Math.round(totalSeconds / 3600)

        // Average completion rate
        const allRates = Object.values(courseMap).map((c) =>
          c.total > 0 ? (c.completed / c.total) * 100 : 0
        )
        const avgCompletion =
          allRates.length > 0
            ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
            : 0

        // Top course by view count
        const topCourseEntry = Object.values(courseMap).sort((a, b) => b.total - a.total)[0]
        const topCourse = topCourseEntry?.title ?? '—'

        // Today's views
        const today = new Date().toISOString().split('T')[0]
        const { count: todayCount } = await supabase
          .from('watch_history')
          .select('id', { count: 'exact', head: true })
          .gte('last_watched_at', today + 'T00:00:00')
          .lt('last_watched_at', today + 'T23:59:59')

        setStats({
          totalHours,
          avgCompletion,
          topCourse,
          todayViews: todayCount ?? 0,
        })
      } catch (err) {
        console.error('Analytics xatoligi:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-8">

      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-xl font-semibold text-white">Analitika</h1>
        <p className="text-sm text-white/40 mt-0.5">Ko&apos;rish statistikasi va kurs natijalari</p>
      </motion.div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Jami ko'rilgan soatlar"
            value={`${stats?.totalHours ?? 0} soat`}
            icon={Clock}
            delay={0}
          />
          <StatCard
            label="O'rtacha completion rate"
            value={`${stats?.avgCompletion ?? 0}%`}
            icon={TrendingUp}
            delay={0.08}
          />
          <StatCard
            label="Eng faol kurs"
            value={stats?.topCourse ?? '—'}
            icon={BookOpen}
            delay={0.16}
            sub="Eng ko'p ko'rilgan"
          />
          <StatCard
            label="Bugungi ko'rishlar"
            value={stats?.todayViews ?? 0}
            icon={Eye}
            delay={0.24}
            sub="Bugun"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Weekly line chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="rounded-xl border border-white/8 bg-white/[0.02] p-5"
        >
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">So&apos;nggi 7 kun ko&apos;rishlar</h2>
            <p className="text-xs text-white/35 mt-0.5">Kunlik ko&apos;rilgan darslar soni</p>
          </div>

          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#ffffff0a" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#ffffff40', fontSize: 12 }}
                    stroke="transparent"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#ffffff40', fontSize: 12 }}
                    stroke="transparent"
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                    itemStyle={{ color: '#1a44f5' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [value ?? 0, "Ko'rishlar"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1a44f5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#1a44f5', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Course completion bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.38 }}
          className="rounded-xl border border-white/8 bg-white/[0.02] p-5"
        >
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">Kurs completion rate</h2>
            <p className="text-xs text-white/35 mt-0.5">Har bir kurs bo&apos;yicha bajarilish foizi</p>
          </div>

          {loading ? (
            <ChartSkeleton />
          ) : completionData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/20 text-sm">Ma&apos;lumot mavjud emas</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completionData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid stroke="#ffffff0a" horizontal={true} vertical={false} />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: '#ffffff40', fontSize: 10 }}
                    stroke="transparent"
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#ffffff40', fontSize: 12 }}
                    stroke="transparent"
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                    itemStyle={{ color: '#1a44f5' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${value ?? 0}%`, 'Completion']}
                  />
                  <Bar
                    dataKey="rate"
                    fill="#1a44f5"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Completion details table */}
      {!loading && completionData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Kurslar reytingi</h2>
          </div>
          <div className="divide-y divide-white/5">
            {completionData.map((course, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-white/25 text-xs tabular-nums w-5 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-white/70 text-sm truncate">{course.title}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${course.rate}%` }}
                    />
                  </div>
                  <span className="text-white/50 text-xs tabular-nums w-9 text-right">
                    {course.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
