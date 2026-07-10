'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  PlayCircle,
  Sun,
  Moon,
  Home,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { useTheme } from '@/components/ThemeProvider'
import { supabase } from '@/lib/supabase'
import { ToastProvider } from '@/components/ui/Toast'

const NAV_ITEMS = [
  { label: 'Dashboard',          href: '/admin',            icon: LayoutDashboard },
  { label: 'Kurslar',            href: '/admin/courses',    icon: BookOpen },
  { label: 'Foydalanuvchilar',   href: '/admin/users',      icon: Users },
  { label: "To'lovlar",          href: '/admin/payments',   icon: CreditCard },
  { label: 'Analitika',          href: '/admin/analytics',  icon: BarChart2 },
  { label: 'Intro video',        href: '/admin/intro',      icon: PlayCircle },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [loading,       setLoading]       = useState(true)
  const [userEmail,     setUserEmail]     = useState<string | null>(null)
  const [collapsed,     setCollapsed]     = useState(false)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  /* ── Auth guard ─────────────────────────────────────────── */
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profile || profile.role !== 'admin') {
        router.replace('/')
        return
      }

      setUserEmail(session.user.email ?? null)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  /* ── Sign out ────────────────────────────────────────────── */
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  /* ── Loading screen ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          <p className="text-white/40 text-sm">Yuklanmoqda…</p>
        </div>
      </div>
    )
  }

  /* ── Shared sidebar content ─────────────────────────────── */
  function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Logo size={48} className="rounded-lg flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-brand-400 text-sm leading-tight">Admin</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavClick}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500 pl-[10px]'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }
                  ${collapsed ? 'justify-center px-0 border-l-0' : ''}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'}`} />
                {!collapsed && <span>{label}</span>}
                {collapsed && (
                  <span className="
                    absolute left-full ml-2 px-2 py-1 rounded-md bg-[var(--bg-dropdown)] border border-white/10 text-white text-xs
                    whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity duration-150 z-50
                  ">
                    {label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Sign out */}
        <div className={`border-t border-white/5 p-3 ${collapsed ? 'flex flex-col items-center gap-1' : ''}`}>
          {!collapsed && userEmail && (
            <p className="text-white/30 text-xs truncate px-1 mb-2">{userEmail}</p>
          )}
          <div className="flex items-center justify-around">
            <Link
              href="/"
              className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
              title="Saytga qaytish"
            >
              <Home className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">

      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col relative flex-shrink-0
          bg-[var(--bg-sidebar)] border-r border-white/5
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <SidebarContent />

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="
            absolute -right-3 top-[72px] z-10
            w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-white/10
            flex items-center justify-center
            text-white/40 hover:text-white hover:border-brand-500/50
            transition-all duration-150
          "
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft  className="w-3 h-3" />
          }
        </button>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-sidebar)] border-r border-white/5 z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Logo size={40} className="rounded-lg" />
                  <span className="font-semibold text-brand-400 text-sm">Admin</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-white/40 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent onNavClick={() => setDrawerOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[var(--bg-sidebar)]">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/50 hover:text-white transition-colors p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Logo size={36} className="rounded-md" />
            <span className="font-semibold text-brand-400 text-sm">Admin</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <ToastProvider />
    </div>
  )
}
