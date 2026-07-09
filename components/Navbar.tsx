'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, Menu, X, LogOut, BookOpen, Shield, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import Logo from '@/components/Logo'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/', label: 'Bosh sahifa' },
  { href: '/courses', label: 'Kurslar' },
  // { href: '/watch', label: 'Darslar' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<{ user: { id: string; email?: string; user_metadata?: { full_name?: string } } } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setIsAdmin(false); return }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'))
  }, [session])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setProfileOpen(false)
    router.push('/')
  }

  const { theme, toggle: toggleTheme } = useTheme()
  const displayName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Profil'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 nav-blur ${
          scrolled
            ? 'bg-[var(--bg)]/80 border-b border-white/5 shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={64} className="rounded-lg" />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {pathname === link.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-white/10 border border-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <div className="relative flex items-center gap-2" ref={profileRef}>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="keep-white flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                      {initials}
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-dropdown)] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-xs text-white/30">Tizimga kirgansiz</p>
                          <p className="text-sm text-white font-medium truncate mt-0.5">{session.user?.email}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            href="/watch"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <BookOpen className="w-4 h-4" /> Darslarim
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-all"
                            >
                              <Shield className="w-4 h-4" /> Admin panel
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" /> Chiqish
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" /> Kirish
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 nav-blur border-b border-white/5 md:hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/5 mt-2 pt-3 flex flex-col gap-2">
                {session ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-xs text-white/30">Kirgansiz</p>
                      <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="px-4 py-3 rounded-lg text-sm text-brand-400 hover:bg-brand-500/10 transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" /> Admin panel
                      </Link>
                    )}
                    <button
                      onClick={() => { handleSignOut(); setOpen(false) }}
                      className="px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 text-left transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Chiqish
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">Kirish</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
