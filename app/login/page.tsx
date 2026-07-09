'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Mail, Lock, User } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/watch'

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email yoki parol noto\'g\'ri'
            : error.message
        )
      } else {
        router.push(redirect)
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(
          error.message.includes('already registered')
            ? 'Bu email allaqachon ro\'yxatdan o\'tgan'
            : error.message
        )
      } else {
        setError('')
        // Email tasdiqlash kerak bo'lsa
        router.push(redirect)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-brand-600/15 top-[-200px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-violet-600/10 bottom-[-150px] right-[-150px]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size={72} className="rounded-xl shadow-xl shadow-brand-600/30" />
          </Link>
        </div>

        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-4 text-sm font-medium transition-all duration-200 relative ${
                  tab === t ? 'text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {t === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-1">
                {tab === 'login' ? 'Xush kelibsiz!' : 'Hisob yarating'}
              </h2>
              <p className="text-white/40 text-sm mb-6">
                {tab === 'login'
                  ? 'Davom etish uchun kiring'
                  : "Kurslarni boshlash uchun ro'yxatdan o'ting"}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {tab === 'register' && (
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Ism va familiya</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Aziz Karimov"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Parol</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xato xabari */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-brand-600/25 mt-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      {tab === 'login' ? 'Kirish' : 'Hisob yaratish'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          <Link href="/" className="hover:text-white/40 transition-colors">
            ← Bosh sahifaga qaytish
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
