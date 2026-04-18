'use client';

import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/config/subscriptions';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Check, Info, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState, useEffect, use } from 'react';
import { Shop } from '@/types/database';

interface SubscriptionPageProps {
  params: Promise<{ 'shop-slug': string }>;
}

function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { 'shop-slug': rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug);
  const router = useRouter();
  const supabase = createClient();
  const { t, language } = useTranslation();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonthOrderCount, setCurrentMonthOrderCount] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: shopData, error: shopError } = await (supabase
        .from('shops') as any)
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopError || !shopData) {
        router.push('/');
        return;
      }

      setShop(shopData);

      if (shopData.subscription_tier === 'starter') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count, error: countError } = await (supabase
          .from('orders') as any)
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', shopData.id)
          .gte('created_at', startOfMonth.toISOString());
          
        if (!countError && count !== null) {
          setCurrentMonthOrderCount(count);
        }
      }
      setLoading(false);
    }

    init();
  }, [slug, supabase, router]);

  if (loading || !shop) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = shop.subscription_tier as SubscriptionTier;
  const config = SUBSCRIPTION_TIERS[currentTier];

  return (
    <div className="space-y-8 p-4 pt-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.subscription')}</h1>
        <p className="text-muted-foreground">
          {t('admin.subscription_subtitle', { name: shop.name })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Overview */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">{t('admin.current_plan')}</h3>
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ 
              __html: t('admin.current_plan_desc', { name: config.name }) 
            }} />
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">
              {formatCurrency(config.price)}
              <span className="text-sm font-normal text-muted-foreground uppercase"> / {language === 'de' ? 'Monat' : 'month'}</span>
            </div>
          </div>
        </div>

        {/* Order Usage (If Starter) */}
        {currentTier === 'starter' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">{t('admin.order_usage')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('admin.order_usage_desc')}
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {config.monthlyOrderLimit === Infinity 
                      ? currentMonthOrderCount 
                      : `${currentMonthOrderCount} / ${config.monthlyOrderLimit}`}
                  </div>
                </div>
                {/* Progress bar */}
                {config.monthlyOrderLimit !== Infinity && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={`h-full ${currentMonthOrderCount >= config.monthlyOrderLimit ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, (currentMonthOrderCount / config.monthlyOrderLimit) * 100)}%` }}
                    />
                  </div>
                )}
                {currentMonthOrderCount >= config.monthlyOrderLimit && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t('admin.limit_reached')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">{t('admin.available_plans')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
            const isCurrent = key === currentTier;
            return (
              <div 
                key={key} 
                className={`flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm ${isCurrent ? 'border-primary ring-1 ring-primary' : ''} ${tier.isComingSoon ? 'grayscale opacity-50' : ''}`}
              >
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline text-3xl font-bold">
                    {tier.isComingSoon ? (
                      <span className="text-2xl">{t('admin.coming_soon')}</span>
                    ) : (
                      <>
                        {formatCurrency(tier.price)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground uppercase">/ {language === 'de' ? 'Mon' : 'mo'}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-6 pt-0">
                  {!tier.isComingSoon && (
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>
                          {tier.monthlyOrderLimit === Infinity 
                            ? t('admin.unlimited') 
                            : t('admin.up_to', { count: tier.monthlyOrderLimit })}
                        </span>
                      </li>
                      {tier.features.map(feature => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{t(`feature.${feature}`)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-6 pt-0 mt-auto">
                   <button 
                      disabled={isCurrent || tier.isComingSoon}
                      className={`inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${
                        isCurrent 
                          ? 'bg-surface-container-high text-on-surface-variant' 
                          : 'bg-primary text-on-primary hover:bg-primary-dim'
                      }`}
                   >
                     {isCurrent ? t('admin.current_plan') : tier.isComingSoon ? t('admin.coming_soon') : t('admin.choose_plan')}
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;
