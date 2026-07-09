'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function IntroPage() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/intro-video')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.url) setUrl(d.url) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Bepul kirish
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Kurs haqida</h1>
          <p className="text-white/40 max-w-xl mx-auto">Kursni boshlashdan oldin qisqacha tanishuv videosini tomosha qiling</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              </div>
            ) : url ? (
              <video src={url} controls autoPlay={false} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                Intro video hali yuklanmagan
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link
            href="/courses"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all duration-300 shadow-xl shadow-brand-600/30 hover:-translate-y-0.5"
          >
            Kursga yozilish <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all duration-300"
          >
            Bosh sahifa
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
