'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ChefHat, Check, ArrowRight, Zap, TrendingUp, UtensilsCrossed,
  LayoutDashboard, QrCode, Headphones, BarChart3
} from 'lucide-react'
import { SUBSCRIPTION_TIERS } from '@/config/subscriptions'

const FEATURES_MATRIX = [
  { label: 'Digitale Speisekarte', starter: true, pro: true, max: true },
  { label: 'Bestell-System', starter: '50-100 Orders', pro: 'Unlimited', max: 'Unlimited' },
  { label: 'Bestellverwaltung (Küchen-Monitor)', starter: true, pro: true, max: true },
  { label: 'Abholung, Lieferung & Vor-Ort', starter: true, pro: true, max: true },
  { label: 'Standard Design', starter: true, pro: true, max: true },
  { label: 'Eigenes Branding', starter: false, pro: true, max: true },
  { label: 'Ohne "Bestellen.io" Branding', starter: false, pro: true, max: true },
  { label: 'Premium Support', starter: false, pro: true, max: true },
  { label: 'Analytics Dashboard', starter: false, pro: false, max: true },
  { label: 'Smart-Marketing Tools', starter: false, pro: false, max: true },
  { label: 'KI-Telefon-Agent', starter: false, pro: false, max: 'Inklusive' },
]

const TIER_ICONS = {
  starter: UtensilsCrossed,
  pro: LayoutDashboard,
  max: BarChart3,
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === false) {
    return <span className="text-white/20 text-lg font-black">—</span>
  }
  if (value === true) {
    return (
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
        <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
      </div>
    )
  }
  return <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{value}</span>
}

export default function PricingPage() {
  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [keyof typeof SUBSCRIPTION_TIERS, typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]][]

  return (
    <div className="relative bg-[#060606] min-h-screen text-white selection:bg-primary/30 antialiased overflow-hidden font-sans">

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 blur-[120px] rounded-[100%] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/8 blur-[150px] rounded-[100%] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />

      {/* Nav */}
      <nav className="absolute top-0 w-full p-6 z-50 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="w-6 h-6 text-on-primary" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Bestellen.io</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-semibold hover:text-primary transition-colors px-4 py-2">Login</Link>
          <Link href="/auth/signup" className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-16 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest mb-8"
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          Transparente Preise, keine Überraschungen
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6"
        >
          FAIR. EINFACH.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">DEIN PREIS.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/60 max-w-xl mx-auto mb-4"
        >
          Kein Provisionsmodell, kein Abo-Dschungel. Wähl deinen Plan und starte sofort.
        </motion.p>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(([key, tier], i) => {
            const Icon = TIER_ICONS[key]
            const isPopular = key === 'pro'
            const isMax = key === 'max'

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className={`relative flex flex-col rounded-[2rem] border p-8 overflow-hidden ${
                  isMax
                    ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 shadow-2xl shadow-primary/10'
                    : isPopular
                    ? 'bg-white/[0.07] border-white/20'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                {isMax && (
                  <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl rounded-tr-[2rem]">
                    Bestseller
                  </div>
                )}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl rounded-tr-[2rem]">
                    Beliebt
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isMax ? 'bg-primary/20 border border-primary/20' : 'bg-white/5 border border-white/10'}`}>
                  <Icon className={`w-6 h-6 ${isMax ? 'text-primary' : 'text-white/60'}`} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-black tracking-tight">{tier.name}</h2>
                  {key === 'starter' && (
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Das Zuckerl
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 mb-6 w-fit">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  {tier.fokus}
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  {tier.price === 0 ? (
                    <span className="text-5xl font-black">Kostenlos</span>
                  ) : (
                    <>
                      <span className="text-5xl font-black">{tier.price}€</span>
                      <span className="text-white/40 font-medium">/Monat</span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {FEATURES_MATRIX.filter(f => {
                    const val = f[key as keyof typeof f]
                    return val !== false
                  }).map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${isMax ? 'bg-primary/20' : 'bg-white/5'}`}>
                        <Check className={`w-3 h-3 ${isMax ? 'text-primary' : 'text-white/50'}`} strokeWidth={3} />
                      </div>
                      <span className="text-white/70">
                        {f.label}
                        {typeof f[key as keyof typeof f] === 'string' && (
                          <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {f[key as keyof typeof f] as string}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                    isMax
                      ? 'bg-primary text-on-primary shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {tier.price === 0 ? 'Kostenlos starten' : `${tier.name} wählen`}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-24"
        >
          <h2 className="text-3xl font-black tracking-tight text-center mb-12">
            Vollständiger Vergleich
          </h2>

          <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-5 text-white/40 font-bold uppercase tracking-widest text-[10px] w-1/2">Feature</th>
                  {tiers.map(([key, tier]) => (
                    <th key={key} className="px-6 py-5 text-center">
                      <div className="font-black text-base">{tier.name}</div>
                      <div className="text-white/40 text-xs font-medium">
                        {tier.price === 0 ? 'Kostenlos' : `${tier.price}€/mo`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {FEATURES_MATRIX.map((feature, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white/70 font-medium">{feature.label}</td>
                    {tiers.map(([key]) => (
                      <td key={key} className="px-6 py-4 text-center">
                        <FeatureValue value={feature[key as keyof typeof feature] as boolean | string} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* FAQ / reassurance */}
      <section className="relative z-10 py-24 px-6 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-br from-primary/15 to-transparent border border-primary/20 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 blur-[80px] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 relative z-10">
            Keine Risiken, keine langen Verträge.
          </h2>
          <p className="text-white/60 text-lg mb-10 relative z-10 max-w-xl mx-auto">
            Starte kostenlos mit bis zu 100 Bestellungen pro Monat. Wenn du wächst, wachsen wir mit dir.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-on-primary rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-transform relative z-10"
          >
            Shop erstellen
            <Zap className="w-5 h-5 fill-current" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center z-10 relative">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/30">
          © {new Date().getFullYear()} Bestellen.io — Made for Restaurants.
        </p>
      </footer>
    </div>
  )
}
