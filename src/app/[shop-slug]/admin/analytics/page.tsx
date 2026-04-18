import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChart3, Lock, ArrowRight, Zap, TrendingUp } from 'lucide-react'
import { SubscriptionTier, SUBSCRIPTION_TIERS } from '@/config/subscriptions'

interface Props {
  params: Promise<{ 'shop-slug': string }>
}

async function AnalyticsPage({ params }: Props) {
  const { 'shop-slug': slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const supabase = await createServerSupabaseClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('subscription_tier, name')
    .eq('slug', decodedSlug)
    .single()

  const tier = (shop?.subscription_tier ?? 'starter') as SubscriptionTier
  const hasAccess = tier === 'max'

  if (!hasAccess) {
    return <AnalyticsUpgradeWall shopSlug={decodedSlug} currentTier={tier} />
  }

  // Lazy-load the real analytics client component (only when max tier)
  const { AnalyticsClient } = await import('./_client')
  return <AnalyticsClient shopSlug={decodedSlug} />
}

export default AnalyticsPage;

function AnalyticsUpgradeWall({ shopSlug, currentTier }: { shopSlug: string; currentTier: SubscriptionTier }) {
  const maxTier = SUBSCRIPTION_TIERS.max
  const features = [
    'Tagesumsatz in Echtzeit',
    'Wöchentliche & monatliche Trends',
    'Top 10 Bestseller nach Umsatz & Menge',
    'CSV-Export aller Bestellungen',
    'Ø Bestellwert & Conversion-Rate',
  ]

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        {/* Glow blob */}
        <div className="relative mb-8 inline-flex">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 rounded-[1.5rem] flex items-center justify-center shadow-lg">
            <Lock className="w-9 h-9 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-on-surface mb-3">
          Analytics ist ein <span className="text-primary">AI-Max</span>-Feature
        </h1>
        <p className="text-on-surface-variant text-base mb-10 leading-relaxed">
          Detaillierte Umsatz-Analysen und Trendberichte sind im <strong>AI-Max-Plan</strong> enthalten.
          Upgrade und versteh genau, was deinen Umsatz treibt.
        </p>

        {/* Feature list */}
        <div className="bg-surface-container-low rounded-2xl p-6 text-left mb-8 space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm font-medium text-on-surface">{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing callout */}
        <div className="flex items-center justify-between px-5 py-4 bg-primary/5 border border-primary/15 rounded-2xl mb-8">
          <div className="text-left">
            <p className="text-sm font-bold text-on-surface">AI-Max-Plan</p>
            <p className="text-xs text-on-surface-variant">Unbegrenzte Bestellungen + Analytics</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-on-surface">{maxTier.price}€</p>
            <p className="text-xs text-on-surface-variant">/Monat</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${shopSlug}/admin/subscription`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-on-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            <Zap className="w-4 h-4" />
            Upgrade auf AI-Max
          </Link>
          <Link
            href="/pricing"
            target="_blank"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-low border border-outline-variant/20 text-on-surface-variant rounded-2xl text-sm font-bold hover:bg-surface-container-high transition-all"
          >
            Alle Pläne vergleichen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-on-surface-variant/60">
          Du bist aktuell im <strong className="capitalize">{currentTier}</strong>-Plan.
        </p>
      </div>
    </div>
  )
}
