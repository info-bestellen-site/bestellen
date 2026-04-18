'use client'

import { useState } from 'react'
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Briefly check if user is actually a super admin before redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.app_metadata?.role !== 'super_admin') {
        await supabase.auth.signOut()
        setError('Keine Berechtigung.')
        return
      }

      window.location.href = '/super-admin/dashboard'
    } catch (err) {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 selection:bg-primary/20">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Super Admin</h1>
            <p className="text-slate-500 text-sm font-medium">Bereich für System-Administratoren</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Admin E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-2xl text-slate-900 font-bold transition-all focus:outline-none focus:ring-4 focus:ring-primary/5 ${
                      error ? 'border-error/20' : 'border-slate-100 focus:border-primary/30'
                    }`}
                    placeholder="admin@system.de"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-2xl text-slate-900 font-bold transition-all focus:outline-none focus:ring-4 focus:ring-primary/5 ${
                      error ? 'border-error/20 animate-shake' : 'border-slate-100 focus:border-primary/30'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-error text-[10px] font-black uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <button
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 py-5 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Einloggen
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-[10px] font-medium italic">
            Zutritt nur für autorisiertes Personal. Alle Aktivitäten werden protokolliert.
          </p>
        </div>
      </div>
    </div>
  )
}
