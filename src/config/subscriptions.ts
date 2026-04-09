import { Database } from '@/types/database';

export type SubscriptionTier = Database['public']['Enums']['subscription_tier'];

export interface TierConfig {
  name: string;
  fokus: string;
  price: number;
  monthlyOrderLimit: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    name: 'Starter',
    fokus: 'Testen',
    price: 0,
    monthlyOrderLimit: 100,
    features: ['menu', 'standard-design', 'powered-by-branding'],
  },
  pro: {
    name: 'Business',
    fokus: 'Wachsen',
    price: 39,
    monthlyOrderLimit: Infinity,
    features: ['menu', 'order-management', 'reservations', 'custom-branding', 'support'],
  },
  max: {
    name: 'AI-Max',
    fokus: 'Automatisieren',
    price: 89,
    monthlyOrderLimit: Infinity,
    features: [
      'menu',
      'order-management',
      'reservations',
      'analytics',
      'smart-marketing',
      'ai-telephon-agent'
    ],
  },
};

export const hasFeature = (tier: SubscriptionTier, feature: string) => {
  return SUBSCRIPTION_TIERS[tier].features.includes(feature);
};
