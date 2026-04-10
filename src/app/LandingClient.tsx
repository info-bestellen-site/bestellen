'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChefHat, ArrowRight, Zap, Target, ShieldCheck, Banknote, Store, Smartphone } from 'lucide-react'

const FEATURES = [
  {
    title: "100% Deine Marge",
    text: "Schluss mit 30% Provision an Lieferdienste. Du zahlst nur deinen fairen Fixpreis, alles andere gehört dir.",
    icon: Banknote,
  },
  {
    title: "In 5 Minuten Live",
    text: "Account erstellen, Speisekarte anlegen – ab die Post. Keine monatelangen IT-Projekte oder Verträge.",
    icon: Zap,
  },
  {
    title: "Null Zettel-Chaos",
    text: "Alle Bestellungen direkt digital aufs Tablet. Keine Missverständnisse oder komplizierten Telefon-Bestellungen.",
    icon: ShieldCheck,
  },
  {
    title: "Perfekt fürs Handy",
    text: "Deine Kunden bestellen kinderleicht über ihr Smartphone. Ganz ohne nervigen App-Download, direkt im Browser.",
    icon: Smartphone,
  }
]

export default function FancyLandingPage() {
  return (
    <div className="relative bg-[#060606] min-h-screen text-white selection:bg-primary/30 antialiased overflow-hidden font-sans">

      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-[100%] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-[100%] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />

      {/* Navigation Layer */}
      <nav className="absolute top-0 w-full p-6 z-50 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="w-6 h-6 text-on-primary" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Bestellen</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm font-semibold hover:text-primary transition-colors px-4 py-2">Preise</Link>
          <Link href="/auth/login" className="text-sm font-semibold hover:text-primary transition-colors px-4 py-2">Login</Link>
          <Link href="/auth/signup" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform">Starten</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-white text-xs font-bold uppercase tracking-widest mb-10 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.03)]"
        >
          <Store className="w-4 h-4 text-white/80" />
          Für smarte Gastronomen
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] mb-8"
        >
          BESTELLUNGEN. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">RADIKAL EINFACH.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mb-12 leading-relaxed"
        >
          Keine Lust auf 30% Lieferdienst-Provision? <br className="hidden md:block" />
          Account erstellen, Speisekarte rein und ab die Post. Ohne teure Hardware, ohne Stress.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <Link href="/auth/signup" className="w-full sm:w-auto px-10 py-5 bg-primary text-on-primary rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
            Jetzt kostenlos starten
          </Link>
          <Link href="/sakura-sushi/demo" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            Live Demo ansehen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Value Props Grid */}
      <section className="py-24 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2rem] hover:bg-white/[0.07] transition-colors group flex flex-col"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/60 text-lg leading-relaxed">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Massive CTA Section */}
      <section className="py-40 px-6 z-10 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 p-12 md:p-24 rounded-[3rem] shadow-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 italic uppercase relative z-10">
            Bereit für den <br /> nächsten Schritt?
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-12 relative z-10 max-w-xl mx-auto">
            Digitalisiere dein Geschäft noch heute. Keine Setup-Gebühren. Keine Hardware-Pflicht.
          </p>
          <Link href="/auth/signup" className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-on-primary rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 transition-transform relative z-10">
            Shop erstellen
            <Zap className="w-5 h-5 fill-current" />
          </Link>
        </motion.div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center z-10 relative">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/30">
          © {new Date().getFullYear()} Bestellen — Made for Restaurants.
        </p>
      </footer>
    </div>
  )
}
