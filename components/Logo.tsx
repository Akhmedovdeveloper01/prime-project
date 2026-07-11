'use client'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 48, className = '' }: LogoProps) {
  const { theme } = useTheme()
  const src = theme === 'light' ? '/logo-light.png' : '/logo-dark.png'
  return (
    <Image src={src} alt="Primeresearch" width={size} height={size} className={className} />
  )
}
