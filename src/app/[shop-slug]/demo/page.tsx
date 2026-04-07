'use client'

import React, { useState, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Monitor, Smartphone, Zap } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function SplitScreenDemo({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // STRICT WHITELIST: Only allow sakura-sushi
  if (shopSlug !== 'sakura-sushi') {
    notFound()
  }

  // Loading state for mobile check
  if (isMobile === null) return <div className="fixed inset-0 bg-white" />

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center font-sans z-[100]">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
          <Monitor className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-black mb-4 tracking-tight">Nur für Desktop-Profis!</h1>
        <p className="text-on-surface-variant text-sm mb-10 leading-relaxed max-w-xs">
          Die interaktive Split-Screen-Demo ist für Desktop-Bildschirme optimiert. Wechsel kurz an deinen Rechner, um die Magie in Echtzeit zu erleben.
        </p>
        
        <div className="flex flex-col w-full gap-3">
          <Link 
            href={`/${shopSlug}`}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            Zum Shop (Mobile Ansicht)
          </Link>
          <Link 
            href="/"
            className="w-full py-4 bg-surface-container-high text-on-surface rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden font-sans z-[100]">
      {/* Split Screens Container */}
      <main className="flex-1 flex flex-col lg:flex-row relative">

        {/* Left: Customer Shop */}
        <div className="flex-1 relative border-r border-outline-variant/10 bg-white">
          <iframe
            src={`/${shopSlug}`}
            className="w-full h-full border-none"
            title="Customer View"
          />
          {/* Label Overlay */}
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 flex items-center gap-2">
            <Smartphone className="w-3 h-3 text-primary" />
            Kundenansicht
          </div>
        </div>

        {/* Right: Admin Monitor */}
        <div className="flex-1 relative bg-[#f9f9f9]">
          <iframe
            src={`/${shopSlug}/demo-admin`}
            className="w-full h-full border-none"
            title="Admin View"
          />
          {/* Label Overlay */}
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-black/80 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 flex items-center gap-2">
            <Monitor className="w-3 h-3 text-primary" />
            Küchen-Monitor
          </div>
        </div>
      </main>

      {/* Floating Action Hint */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6"
        >
          <div className="bg-surface-container-high border border-outline-variant/10 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black mb-0.5 text-on-surface">Probier es aus!</p>
              <p className="text-[11px] text-on-surface-variant leading-tight font-medium">Wähle links ein Produkt und schau, wie es rechts in Echtzeit erscheint.</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mini Exit Button */}
      <div className="absolute bottom-4 right-4 z-[60]">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
          Demo Beenden
        </Link>
      </div>

    </div>
  )
}
