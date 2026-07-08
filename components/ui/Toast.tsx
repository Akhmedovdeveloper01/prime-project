'use client'
/** Toast notification — muvaffaqiyat/xato xabarlari uchun */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let toastId = 0
type Listener = (toast: ToastItem) => void
const listeners: Listener[] = []

export function toast(message: string, type: ToastType = 'success') {
  const item: ToastItem = { id: ++toastId, type, message }
  listeners.forEach((fn) => fn(item))
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== item.id)), 3500)
  }, [])

  useEffect(() => {
    listeners.push(add)
    return () => { listeners.splice(listeners.indexOf(add), 1) }
  }, [add])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/90 border-red-500/30 text-red-300'
            }`}
          >
            {t.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <XCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{t.message}</span>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="ml-1 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
