'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChefHat, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if user has a shop
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: shop } = await supabase
        .from('shops')
        .select('slug')
        .eq('owner_id', user.id)
        .single()

      if (shop) {
        router.push(`/${shop.slug}/admin`)
      } else {
        router.push('/onboarding')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter">Bestellen</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight mb-2">Willkommen zurück</h1>
          <p className="text-sm text-on-surface-variant font-medium">Verwalte deinen Shop und deine Bestellungen.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-6">
          {error && (
            <div className="p-4 bg-error/5 text-error text-xs font-bold rounded-xl animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">E-Mail Adresse</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@restaurant.de"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Anmelden'}
          </button>

          <p className="text-center text-xs text-on-surface-variant font-medium pt-2">
            Noch kein Konto?{' '}
            <Link href="/auth/signup" className="text-primary font-bold hover:underline">
              Kostenlos registrieren
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
