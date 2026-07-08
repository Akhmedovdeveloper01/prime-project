'use client'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  ArrowRight, Play, Star, Users, BookOpen, Award, ChevronDown,
  Zap, Globe, Shield, TrendingUp, CheckCircle2, Clock, BarChart2
} from 'lucide-react'

const courses = [
  {
    id: 1,
    tag: 'SCOPUS',
    title: 'SCOPUS maqola yozish — bosqichma-bosqich',
    desc: 'Xalqaro jurnallarda maqola chop etish jarayonini to\'liq o\'rganing',
    lessons: 12,
    hours: '4.5 soat',
    students: 842,
    rating: 4.9,
    color: 'from-blue-500/20 to-violet-500/20',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    badge: 'bg-blue-500/10 text-blue-400',
    icon: '📄',
  },
  {
    id: 2,
    tag: 'WoS',
    title: 'Jurnal tanlash va Impact Factor tushunish',
    desc: 'To\'g\'ri jurnal tanlash orqali maqolangiz qabul ehtimolini oshiring',
    lessons: 8,
    hours: '2.5 soat',
    students: 631,
    rating: 4.8,
    color: 'from-violet-500/20 to-pink-500/20',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    badge: 'bg-violet-500/10 text-violet-400',
    icon: '🔍',
  },
  {
    id: 3,
    tag: 'PhD',
    title: 'PhD dissertatsiya himoyasiga tayyorlanish',
    desc: 'Himoya jarayonidagi har bir bosqichni ishonch bilan o\'ting',
    lessons: 15,
    hours: '6 soat',
    students: 1240,
    rating: 4.9,
    color: 'from-emerald-500/20 to-cyan-500/20',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-400',
    icon: '🎓',
  },
]

const stats = [
  { value: '2,400+', label: 'Talabalar', icon: Users },
  { value: '18', label: 'Kurs', icon: BookOpen },
  { value: '94%', label: 'Muvaffaqiyat', icon: Award },
  { value: '4.9★', label: 'Reyting', icon: Star },
]

const features = [
  { icon: Zap, title: 'Tezkor natija', desc: 'Birinchi maqolangizni 30 kun ichida tayyorlang' },
  { icon: Globe, title: 'Xalqaro standart', desc: 'SCOPUS, WoS, Elsevier talablariga mos' },
  { icon: Shield, title: 'Kafolat', desc: '30 kunlik to\'liq pul qaytarish kafolati' },
  { icon: TrendingUp, title: 'Natija ko\'rsatkichi', desc: 'Har bir dars progress tracking bilan' },
]

const testimonials = [
  { name: 'Dr. Aziz Karimov', role: 'TDTU professori', text: 'Kurs tufayli Elsevier jurnalida maqolam qabul qilindi. Juda amaliy va tushunarli.', rating: 5 },
  { name: 'Malika Yusupova', role: 'PhD talabasi, NUU', text: 'IMRaD strukturasini hech qachon tushunmagan edim. Endi o\'zim yoza olaman.', rating: 5 },
  { name: 'Prof. Sherzod Mirzayev', role: 'Ilmiy rahbar', text: 'Talabalarimga majburiy tavsiya etaman. Dasturlash kabi aniq va tizimli.', rating: 5 },
]

function FloatingCard({ delay = 0, children, className = '' }: { delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ target, duration = 2 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState('0')
  const num = parseInt(target.replace(/\D/g, ''))
  const suffix = target.replace(/[\d]/g, '')

  useEffect(() => {
    let start = 0
    const step = num / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setDisplay(target); clearInterval(timer) }
      else setDisplay(Math.floor(start) + suffix)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [target, num, suffix, duration])

  return <span>{display}</span>
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setInView(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#05060f] text-white overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div style={{ y }} className="absolute inset-0">
            <div className="orb w-[600px] h-[600px] bg-brand-600/20 top-[-200px] left-[-200px]" />
            <div className="orb w-[500px] h-[500px] bg-violet-600/15 top-[100px] right-[-150px]" />
            <div className="orb w-[400px] h-[400px] bg-cyan-600/10 bottom-[50px] left-[30%]" />
          </motion.div>
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <motion.div style={{ opacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            O'zbekistondagi #1 ilmiy kurs platformasi
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-white">SCOPUS va PhD</span>
            <br />
            <span className="gradient-text">uchun ilmiy kurslar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Dissertatsiya himoyasi va xalqaro jurnallarda maqola chop etish uchun 
            amaliy video kurslar. O'z tempingizda, istalgan vaqtda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/courses"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base transition-all duration-300 shadow-xl shadow-brand-600/30 hover:shadow-brand-500/50 hover:-translate-y-1"
            >
              Kurslarga o'tish
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/watch"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-base transition-all duration-300"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
                <Play className="w-3 h-3 fill-white" />
              </div>
              Demo ko'rish
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-4 rounded-xl glass">
                <span className="text-2xl font-bold text-white">
                  {inView ? <CountUp target={stat.value} duration={1.5} /> : '0'}
                </span>
                <span className="text-xs text-white/40">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-xs">Pastga aylantiring</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Courses section */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-brand-400 text-sm font-medium uppercase tracking-widest">Kurslar</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Mashhur kurslar</h2>
            <p className="text-white/40 max-w-xl mx-auto">Har bir kurs amaliy topshiriqlar va real misollar bilan to'ldirilgan</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`group relative rounded-2xl border p-6 glass glass-hover ${course.border} transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${course.badge}`}>{course.tag}</span>
                    <span className="text-2xl">{course.icon}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 leading-snug">{course.title}</h3>
                  <p className="text-sm text-white/40 mb-5 leading-relaxed">{course.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-white/30 mb-5">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.lessons} dars</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.hours}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-white">{course.rating}</span>
                    </div>
                    <Link href="/watch" className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium group-hover:gap-2.5 transition-all">
                      Boshlash <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl glass glass-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Talabalar fikri</h2>
            <p className="text-white/40">2,400+ muvaffaqiyatli talabalar</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl glass glass-hover"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden p-10 text-center glass border border-brand-500/20"
          >
            <div className="orb w-[400px] h-[400px] bg-brand-600/20 top-[-100px] left-[-100px]" />
            <div className="orb w-[300px] h-[300px] bg-violet-600/15 bottom-[-100px] right-[-100px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bugun boshlang</h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">Birinchi darsni bepul ko'ring. To'lov faqat kurs davom ettirishdan oldin.</p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all duration-300 shadow-xl shadow-brand-600/30 hover:shadow-brand-500/50 hover:-translate-y-1"
              >
                Bepul boshlash <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white text-lg">Ilm<span className="gradient-text">Hub</span></span>
          <p className="text-white/20 text-sm">© 2025 IlmHub. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  )
}
