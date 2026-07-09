'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle2, AlertCircle, Play, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export default function IntroVideoPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/intro-video')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.url && setCurrentUrl(d.url))
      .catch(() => {})
  }, [])

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setStatus('error'); setMessage('Faqat video fayl yuklang'); return
    }

    setUploading(true); setProgress(0); setStatus('idle')

    const token = await getToken()

    const res = await fetch('/api/admin/intro-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentType: file.type }),
    })

    if (!res.ok) {
      setUploading(false); setStatus('error'); setMessage('URL olishda xato'); return
    }

    const { uploadUrl, key } = await res.json()

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)) }
      xhr.onload = () => xhr.status < 300 ? resolve() : reject()
      xhr.onerror = reject
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    }).catch(() => {
      setUploading(false); setStatus('error'); setMessage('Yuklashda xato'); return
    })

    const saveRes = await fetch('/api/admin/intro-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key }),
    })

    if (!saveRes.ok) {
      setUploading(false); setStatus('error'); setMessage('Saqlashda xato'); return
    }

    const preview = await fetch('/api/intro-video').then(r => r.json()).catch(() => ({}))
    if (preview?.url) setCurrentUrl(preview.url)

    setUploading(false); setProgress(100); setStatus('success')
    setMessage('Intro video muvaffaqiyatli yuklandi!')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Intro video</h1>
        <p className="text-white/40 text-sm mb-8">Bu video barcha tashrif buyuruvchilarga ochiq ko'rinadi</p>

        {/* Joriy video */}
        {currentUrl && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium text-white">Joriy intro video</span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              <video src={currentUrl} controls className="w-full h-full" />
            </div>
            <p className="text-xs text-white/30 mt-2">
              Havola: <span className="text-brand-400">{typeof window !== 'undefined' ? window.location.origin : ''}/intro</span>
            </p>
          </div>
        )}

        {/* Upload zona */}
        <div
          className="border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-600/20 transition-colors">
            {uploading ? <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" /> : <Upload className="w-6 h-6 text-brand-400" />}
          </div>
          <p className="text-white font-medium mb-1">{currentUrl ? 'Videoni almashtirish' : 'Video yuklash'}</p>
          <p className="text-white/30 text-sm">Faylni shu yerga tashlang yoki bosing</p>
          <p className="text-white/20 text-xs mt-2">MP4, MOV, WebM</p>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Yuklanmoqda…</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Status */}
        {status !== 'idle' && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            status === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message}
          </div>
        )}
      </motion.div>
    </div>
  )
}
