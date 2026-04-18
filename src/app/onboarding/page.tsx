'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChefHat, Store, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { normalizeSlug } from '@/lib/utils/slug'

function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      // Also check if user ALREADY has a shop
      const { data: shop } = await (supabase
        .from('shops') as any)
        .select('slug')
        .eq('owner_id', user.id)
        .single()

      if (shop) {
        router.push(`/${shop.slug}/admin`)
      }
    }
    checkUser()
  }, [supabase, router])

  // Clear slug and generate from name
  useEffect(() => {
    if (shopName) {
      setSlug(normalizeSlug(shopName))
    }
  }, [shopName])

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setChecking(true)
      const { data } = await (supabase
        .from('shops') as any)
        .select('slug')
        .eq('slug', slug)
        .single()

      setSlugAvailable(!data)
      setChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [slug, supabase])

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !slugAvailable) return

    setLoading(true)
    const { error } = await (supabase
      .from('shops') as any)
      .insert({
        name: shopName,
        slug: slug,
        owner_id: userId,
        is_open: true
      })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push(`/${slug}/admin`)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary text-on-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Richte deinen Shop ein</h1>
          <p className="text-lg text-on-surface-variant font-medium">In wenigen Sekunden ist dein Online-Angebot startklar.</p>
        </div>

        <form onSubmit={handleCreateShop} className="bg-white rounded-[2rem] p-10 border border-outline-variant/10 shadow-2xl shadow-primary/5 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Restaurant Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/30" />
                <input
                  required
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="z.B. Sushi Gallery"
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-semibold focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Dein Slug (URL Pfad)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/30" />
                <input
                  required
                  type="text"
                  value={slug}
                  onChange={e => setSlug(normalizeSlug(e.target.value))}
                  placeholder="sushi-gallery"
                  className={`w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold transition-all ${slugAvailable === true ? 'ring-2 ring-success/20' :
                      slugAvailable === false ? 'ring-2 ring-error/20' : ''
                    }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checking ? <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant/40" /> :
                    slugAvailable === true ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                      slugAvailable === false ? <CheckCircle2 className="w-5 h-5 text-error rotate-45" /> : null}
                </div>
              </div>
              <p className="mt-2.5 ml-1 text-xs text-on-surface-variant font-medium">
                Deine Kunden bestellen unter: <span className="text-primary font-bold">bestellen.site/{slug || '...'}</span>
              </p>
            </div>
          </div>

          <button
            disabled={loading || !slugAvailable || !shopName}
            className="w-full py-5 bg-primary text-on-primary rounded-full font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Shop erstellen'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage;
