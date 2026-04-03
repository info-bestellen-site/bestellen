'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChefHat, ArrowRight, Zap, Star, ShieldCheck, Award } from 'lucide-react'

const KEY_FACTS = [
  {
    title: "Blitzschnell Starten",
    text: "In weniger als 5 Minuten ist dein Shop online. Keine Technik-Kenntnisse nötig.",
    icon: Zap,
    range: [0.03, 0.25]
  },
  {
    title: "Maximale Effizienz",
    text: "Dein Team hat den Kopf frei für das, was zählt: exzellentes Essen.",
    icon: Star,
    range: [0.28, 0.48]
  },
  {
    title: "Sicher & Stabil",
    text: "Verlässliche Technik für stressfreie Schichten, auch zu Stoßzeiten.",
    icon: ShieldCheck,
    range: [0.52, 0.72]
  },
  {
    title: "Mehr Umsatz",
    text: "Optimiere deine Auslastung und steigere deinen Durchschnittsumsatz.",
    icon: Award,
    range: [0.75, 0.90]
  }
]

export default function FancyLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Hook-safe transforms (must be at top level)
  const videoScale = useTransform(scrollYProgress, [0, 0.1], [0.8, 1])
  const videoOpacity = useTransform(scrollYProgress, [0, 0.05], [0.5, 1])

  // Preloader Logic
  useEffect(() => {
    const xhr = new XMLHttpRequest()
    // By fetching the file via XHR as a blob, we force the browser to buffer the ENTIRE video into RAM.
    xhr.open('GET', '/Items_flying_out_202604022235.mp4', true)
    xhr.responseType = 'blob'
    
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        setLoadingProgress(Math.round(percentComplete))
      } else {
        setLoadingProgress((prev) => Math.min(prev + 2, 99))
      }
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const videoBlob = xhr.response
        const url = URL.createObjectURL(videoBlob)
        setVideoSrc(url)
        setLoadingProgress(100)
      } else {
        setVideoSrc('/Items_flying_out_202604022235.mp4')
        setLoadingProgress(100)
      }
    }

    xhr.onerror = () => {
      setVideoSrc('/Items_flying_out_202604022235.mp4')
      setLoadingProgress(100)
    }
    
    xhr.send()

    return () => xhr.abort()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoLoaded(true)
      video.currentTime = 0
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [videoSrc]) // Re-run when videoSrc is finally set

  // LERP logic for super-smooth scrubbing
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let targetProgress = 0
    let currentSmoothProgress = 0
    let isMounted = true
    const smoothingFactor = 0.5 // High responsiveness

    const unsubscribe = scrollYProgress.on('change', (v) => {
      targetProgress = v
    })

    const updateScrub = () => {
      if (!isMounted) return

      if (!video.duration) {
        requestAnimationFrame(updateScrub)
        return
      }

      // Smoothly interpolate progress
      currentSmoothProgress += (targetProgress - currentSmoothProgress) * smoothingFactor
      
      const targetTime = currentSmoothProgress * video.duration
      
      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime
      }

      requestAnimationFrame(updateScrub)
    }

    requestAnimationFrame(updateScrub)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [scrollYProgress, videoLoaded])

  return (
    <div className="relative bg-[#060606] text-white selection:bg-primary/30 antialiased">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {loadingProgress < 100 && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white"
          >
            <div className="w-16 h-16 bg-primary/20 rounded-[2rem] flex items-center justify-center animate-pulse mb-8 border border-primary/20 shadow-[0_0_40px_rgba(var(--primary-rgb),0.2)]">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-[0.2em] mb-6 italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary-dim">
              Preparing Experience
            </h2>
            <div className="w-64 h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              {loadingProgress}% Geladen
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sequence Container - Height dictates how long the video pins */}
      <div ref={containerRef} className="relative h-[400vh]">
        {/* Sticky Video Container */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-black z-0">
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80 z-10 pointer-events-none" />
        
        {/* The Scrubber Video - Only inject src when preloaded to prevent streaming */}
        {videoSrc && (
          <motion.div 
            style={{ 
              scale: videoScale,
              opacity: videoOpacity
            }}
            className="w-full h-full max-h-[80vh] mt-20 flex items-center justify-center will-change-transform"
          >
            <motion.video
              ref={videoRef}
              src={videoSrc}
              playsInline
              muted
              preload="auto"
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}

        {/* Hero Overlay (Intro) */}
        <motion.div 
          style={{ 
            opacity: useTransform(scrollYProgress, [0, 0.02], [1, 0]),
            scale: useTransform(scrollYProgress, [0, 0.02], [1, 0.95]),
            y: useTransform(scrollYProgress, [0, 0.02], [0, -20])
          }}
          className="absolute z-20 text-center px-6 pointer-events-none"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 rotate-12 group-hover:rotate-0 transition-transform">
              <ChefHat className="w-7 h-7 text-on-primary" />
            </div>
            <span className="text-4xl font-black tracking-tighter uppercase italic">Bestellen.io</span>
          </motion.div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]">
            DAS <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary-dim">NÄCHSTE</span> <br/>
            LEVEL.
          </h1>
          <p className="text-sm text-white/40 font-black uppercase tracking-[0.4em]">
            Scrollen zum Entdecken
          </p>
        </motion.div>

        {/* Keyfacts Overlays - Alternating Sides */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {KEY_FACTS.map((fact, index) => (
            <KeyFactOverlay 
              key={index} 
              fact={fact} 
              index={index}
              progress={scrollYProgress} 
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          style={{ opacity: useTransform(scrollYProgress, [0, 0.02], [1, 0]) }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Scroll</span>
          <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-white/50 to-transparent overflow-hidden relative">
            <motion.div 
              animate={{ y: [-100, 100] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-full bg-primary"
            />
          </div>
        </motion.div>
        </div>
      </div>

      {/* Modern Marketing Section - Enters naturally after scroll sequence */}
      <section className="relative z-40 bg-white text-black py-40 sm:py-64 rounded-t-[5rem] sm:rounded-t-[8rem] -mt-[15vh] shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-primary/10">
                <Star className="w-3 h-3 fill-current" />
                Pure Digitalisierung
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tight mb-10 leading-[0.9] uppercase">
                RADIKAL. <br/>
                <span className="text-primary-dim opacity-20 hover:opacity-100 transition-opacity cursor-default">EINFACH.</span> <br/>
                GASTRO.
              </h2>
              <p className="text-xl text-on-surface-variant font-medium leading-relaxed mb-12 max-w-xl">
                Wir haben alles Unnötige entfernt. Was bleibt, ist ein System, das so intuitiv ist, dass dein Team es in Sekunden versteht.
              </p>
              
              <div className="grid grid-cols-2 gap-12 mb-16">
                <div className="group">
                  <div className="text-5xl font-black text-primary mb-2 group-hover:scale-110 transition-transform origin-left">0%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Fehlbestellungen</div>
                </div>
                <div className="group">
                  <div className="text-5xl font-black text-primary mb-2 group-hover:scale-110 transition-transform origin-left">30%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Mehr Durchlauf</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <Link href="/auth/signup" className="px-12 py-6 bg-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-102 active:scale-95 transition-all">
                  Kostenlos Starten
                </Link>
                <Link href="/demo-sushi" className="px-12 py-6 bg-surface-container-low text-on-surface rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container-high transition-all">
                  Live Demo
                </Link>
              </div>
            </motion.div>

            <motion.div 
               initial={{ x: 50, opacity: 0 }}
               whileInView={{ x: 0, opacity: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="relative lg:scale-110"
            >
              <div className="aspect-[4/5] rounded-[4rem] bg-[#0a0a0a] overflow-hidden border border-white/10 shadow-3xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white text-center">
                   <div className="w-24 h-24 mb-6 bg-white/5 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border border-white/10">
                     <ChefHat className="w-12 h-12 text-primary" />
                   </div>
                   <h3 className="text-3xl font-black tracking-tighter mb-4 italic uppercase">Die Zukunft ist jetzt.</h3>
                   <p className="text-sm font-medium text-white/40 tracking-widest uppercase">Premium Experience</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-white py-32 text-center border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto px-6">
           <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-10 rotate-12">
             <Award className="w-10 h-10 text-primary" />
           </div>
           <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 italic uppercase">Bist du dabei?</h3>
           <Link href="/auth/signup" className="inline-flex items-center gap-4 px-16 py-8 bg-primary text-on-primary rounded-full font-black text-md uppercase tracking-[0.2em] shadow-3xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
              Jetzt Loslegen
              <ArrowRight className="w-6 h-6" />
           </Link>
        </div>
      </section>

      <footer className="bg-white py-20 text-center">
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-outline-variant/10">
           <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 text-black">
             © {new Date().getFullYear()} Bestellen.io — Disrupting Gastronomy
           </p>
        </div>
      </footer>
    </div>
  )
}

function KeyFactOverlay({ fact, index, progress }: { fact: any, index: number, progress: any }) {
  const isEven = index % 2 === 0
  const range = fact.range
  
  // Ensure strictly increasing points within [0, 1] range to avoid WAAPI monotonic error
  const p1 = Math.max(0, range[0] - 0.05)
  const p2 = Math.max(p1 + 0.01, range[0])
  const p3 = Math.max(p2 + 0.01, range[1])
  const p4 = Math.min(1, p3 + 0.05)

  // Custom motion values for side-positioning
  const opacity = useTransform(progress, [p1, p2, p3, p4], [0, 1, 1, 0])
  const x = useTransform(progress, [p1, p2, p3, p4], [isEven ? 100 : -100, 0, 0, isEven ? 100 : -100])
  const y = useTransform(progress, [p1, p2, p3, p4], [10, 0, 0, -10])
  const blur = useTransform(progress, [p2, p3], ["0px", "0px"]) // Sharper cards

  return (
    <motion.div 
      style={{ 
        opacity, 
        x, 
        y, 
        filter: `blur(${blur})`,
        left: isEven ? 'auto' : '5%',
        right: isEven ? '5%' : 'auto',
        textAlign: isEven ? 'right' : 'left'
      }}
      className={`absolute top-1/2 -translate-y-1/2 w-full max-w-[280px] sm:max-w-md px-4`}
    >
      <div className={`flex flex-col ${isEven ? 'items-end' : 'items-start'} gap-6`}>
        <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
          <fact.icon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none uppercase italic text-white drop-shadow-2xl">
            {fact.title}
          </h2>
          <div className={`w-20 h-1 bg-primary mb-4 ${isEven ? 'ml-auto' : 'mr-auto'}`} />
          <p className="text-base sm:text-lg text-white/50 font-bold uppercase tracking-tight leading-snug">
            {fact.text}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
