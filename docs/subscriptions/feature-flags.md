# Feature-Management & Berechtigungen

Diese Dokumentation erklärt, wie Features bestimmten Abonnement-Stufen zugeordnet werden und wie diese Berechtigungen im Code geprüft werden.

## Wo werden Features definiert?

Die Zuordnung von Features zu Tiers erfolgt ausschließlich in der Datei:
`src/config/subscriptions.ts`

### Beispiel für eine Tier-Konfiguration:

```typescript
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    // ...
    features: ['menu', 'standard-design'],
  },
  pro: {
    // ...
    features: ['menu', 'order-management', 'reservations', 'custom-branding'],
  },
  // ...
};
```

## Wie füge ich ein neues Feature hinzu?

1.  **Feature-Key festlegen:** Denke dir einen eindeutigen String für das Feature aus (z. B. `'analytics-v2'`).
2.  **Zuordnung:** Füge diesen String in `src/config/subscriptions.ts` bei den entsprechenden Tiers zum `features` Array hinzu.
3.  **Anzeige:** Wenn das Feature auf der Preisseite (`/pricing`) in der Matrix erscheinen soll, füge es zusätzlich zum `FEATURES_MATRIX` Array in `src/app/pricing/page.tsx` hinzu.

## Prüfung im Code (Feature Flags)

Um zu prüfen, ob ein Shop Zugriff auf ein bestimmtes Feature hat, gibt es eine Hilfsfunktion `hasFeature`.

### Verwendung:

```typescript
import { hasFeature } from '@/config/subscriptions';

// Innerhalb einer Komponente oder eines Service
if (hasFeature(shop.subscription_tier, 'reservations')) {
  // Zeige Reservierungs-Features
}
```

### In UI-Komponenten (Beispiel Sidebar):

Oft wird die Sidebar oder das Menü basierend auf dem Plan gefiltert. Suche nach Stellen, an denen `shop.subscription_tier` verwendet wird, um den Zugriff auf ganze Seiten zu steuern.

## Wichtige Hinweise

*   **Vorsicht bei Änderungen:** Wenn du ein Feature von einem höheren Tier in ein niedrigeres verschiebst, haben sofort alle Nutzer dieses Tiers Zugriff darauf.
*   **Datenbank vs. Konfiguration:** Die App vertraut der `subscription_tier` Spalte in der Datenbank. Die *Bedeutung* dieser Tier (welche Features sie hat) wird aber rein über den Code (`src/config/subscriptions.ts`) gesteuert.
