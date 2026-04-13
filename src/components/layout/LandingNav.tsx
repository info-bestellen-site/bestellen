'use client'

import React from 'react'
import Link from 'next/link'
import { ChefHat } from 'lucide-react'
import { motion } from 'framer-motion'

export function LandingNav() {
  return (
    <nav className="absolute top-0 w-full p-4 sm:p-6 z-50 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-on-primary" />
        </div>
        <span className="text-lg sm:text-xl font-bold tracking-tighter uppercase italic hidden min-[450px]:block">
          Bestellen
        </span>
      </Link>
      
      <div className="flex items-center gap-0.5 sm:gap-4">
        <Link 
          href="/pricing" 
          className="text-[13px] sm:text-sm font-semibold hover:text-primary transition-colors px-2.5 sm:px-4 py-2"
        >
          Preise
        </Link>
        <Link 
          href="/auth/login" 
          className="text-[13px] sm:text-sm font-semibold hover:text-primary transition-colors px-2.5 sm:px-4 py-2"
        >
          Login
        </Link>
        <Link 
          href="/auth/signup" 
          className="text-[12px] sm:text-[13px] md:text-sm font-bold bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
        >
          Starten
        </Link>
      </div>
    </nav>
  )
}
