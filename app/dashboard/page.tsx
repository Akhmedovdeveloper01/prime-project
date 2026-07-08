'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Users, Clock, TrendingUp, BookOpen, BarChart2, ArrowUpRight, ArrowDownRight, Eye, Award } from 'lucide-react'

const metrics = [
  { label: 'Jami foydalanuvchi', value: '2,847', change: '+12.5%', up: true, icon: Users, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', icon_color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Faol (30 kun)', value: '1,240', change: '+8.2%', up: true, icon: TrendingUp, color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', icon_color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Jami ko\'rilgan soat', value: '8,421', change: '+23.1%', up: true, icon: Clock, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', icon_color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: "O'rtacha sessiya", value: '52 daq', change: '-3.4%', up: false, icon: BarChart2, color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', icon_color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

const users = [
  { name: 'Aziz Karimov', email: 'aziz@gmail.com', course: 'SCOPUS maqola yozish', time: '4s 12d', progress: 62, status: 'active' },
  { name: 'Malika Yusupova', email: 'malika@mail.ru', course: 'Jurnal tanlash', time: '2s 55d', progress: 80, status: 'active' },
  { name: 'Jasur Toshmatov', email: 'jasur@umail.uz', course: 'PhD himoya', time: '6s 40d', progress: 45, status: 'active' },
  { name: 'Nodira Xolmatova', email: 'nodira@gmail.com', course: 'SCOPUS maqola yozish', time: '1s 08d', progress: 20, status: 'inactive' },
  { name: 'Sherzod Mirzayev', email: 'sherzod@mail.uz', course: 'Annotatsiya yozish', time: '45d', progress: 90, status: 'active' },
  { name: 'Dilorom Rashidova', email: 'dilora@gmail.com', course: 'PhD himoya', time: '3s 22d', progress: 35, status: 'inactive' },
]

const courseStats = [
  { name: 'SCOPUS maqola yozish', enrolled: 842, completion: 68, revenue: '248M so\'m', color: 'bg-blue-500' },
  { name: 'PhD himoya tayyorlash', enrolled: 1240, completion: 54, revenue: '492M so\'m', color: 'bg-violet-500' },
  { name: 'Jurnal tanlash', enrolled: 631, completion: 71, revenue: '124M so\'m', color: 'bg-emerald-500' },
  { name: 'Annotatsiya yozish', enrolled: 2100, completion: 83, revenue: '—', color: 'bg-amber-500' },
]

const weekData = [65, 48, 72, 91, 58, 84, 76]
const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const maxVal = Math.max(...weekData)

export default function DashboardPage() {
  const [tab, setTab] = useState<'users' | 'courses'>('users')

  return (
    <div className="min-h-screen bg-[#05060f] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-white/40 text-sm">Barcha statistikalar real vaqtda yangilanadi</p>
        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -3 }}
              className={`relative p-5 rounded-2xl glass border ${m.border} overflow-hidden group transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
                  <m.icon className={`w-4.5 h-4.5 ${m.icon_color}`} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{m.value}</p>
                <p className="text-xs text-white/40 mb-2">{m.label}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {m.change} <span className="text-white/20 font-normal">o'tgan oyga nisbatan</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 p-6 rounded-2xl glass border border-white/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">Haftalik faollik</h3>
                <p className="text-xs text-white/30 mt-0.5">Ko'rilgan soatlar (bu hafta)</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">+18% o'tgan haftaga</span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {weekData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-white/30">{val}s</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(val / maxVal) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.07, duration: 0.6, ease: 'easeOut' }}
                      className={`w-full rounded-t-lg ${i === 3 ? 'bg-brand-500' : 'bg-white/10'} hover:bg-brand-500/60 transition-colors cursor-pointer`}
                    />
                  </div>
                  <span className={`text-[10px] ${i === 3 ? 'text-brand-400 font-medium' : 'text-white/20'}`}>{days[i]}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Course completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl glass border border-white/5"
          >
            <h3 className="text-base font-semibold text-white mb-1">Kurs tugatish %</h3>
            <p className="text-xs text-white/30 mb-5">Har kurs bo'yicha</p>
            <div className="flex flex-col gap-4">
              {courseStats.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/60 truncate max-w-[140px]">{c.name}</span>
                    <span className="text-xs font-semibold text-white">{c.completion}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${c.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.completion}%` }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl glass border border-white/5 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex gap-1 p-1 rounded-xl bg-white/5">
              {(['users', 'courses'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${tab === t ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  {t === 'users' ? 'Foydalanuvchilar' : 'Kurslar'}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/30">
              {tab === 'users' ? `${users.length} ta` : `${courseStats.length} ta kurs`}
            </span>
          </div>

          <div className="overflow-x-auto">
            {tab === 'users' ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Ism', 'Kurs', 'Ko\'rilgan vaqt', 'Borish', 'Holat'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-medium text-white/25 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="border-b border-white/3 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-[11px] text-white/30">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50 max-w-[160px] truncate">{u.course}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                          <Clock className="w-3.5 h-3.5 text-white/20" />{u.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-brand-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${u.progress}%` }}
                              transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                            />
                          </div>
                          <span className="text-xs text-white/40">{u.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/25'}`}>
                          {u.status === 'active' ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Kurs', 'Talabalar', 'Tugatish %', 'Daromad'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-medium text-white/25 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseStats.map((c, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="border-b border-white/3 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${c.color}`} />
                          <span className="text-sm font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">{c.enrolled.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${c.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${c.completion}%` }}
                              transition={{ delay: 0.8 + i * 0.08, duration: 0.7 }}
                            />
                          </div>
                          <span className="text-xs text-white/50">{c.completion}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-400">{c.revenue}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
