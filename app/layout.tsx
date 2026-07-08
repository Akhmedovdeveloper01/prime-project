import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IlmHub — SCOPUS & PhD Kurslar',
  description: 'Xalqaro ilmiy maqola yozish va PhD tayyorlash uchun professional kurslar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-[#05060f] antialiased">{children}</body>
    </html>
  )
}
