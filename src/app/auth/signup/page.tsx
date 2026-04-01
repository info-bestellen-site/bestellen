'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChefHat, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-6 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-4">Fast geschafft!</h1>
          <p className="text-lg text-on-surface-variant font-medium mb-8">
            Wir haben dir einen Bestätigungslink an <b>{email}</b> gesendet.
            Bitte klicke auf den Link, um dein Konto zu aktivieren.
          </p>
          <p className="text-xs text-on-surface-variant">
            Keine E-Mail erhalten? Schau bitte auch im Spam-Ordner nach.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter">Bestellen</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight mb-2">Konto erstellen</h1>
          <p className="text-sm text-on-surface-variant font-medium">Digitalisiere deinen Betrieb in wenigen Minuten.</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-6">
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
                  minLength={6}
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Konto erstellen'}
          </button>

          <p className="text-center text-xs text-on-surface-variant font-medium pt-2">
            Bereits ein Konto?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
