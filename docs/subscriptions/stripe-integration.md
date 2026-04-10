# Stripe-Integration (Geplant)

Diese Dokumentation beschreibt den aktuellen Stand und das geplante Konzept für die Anbindung von Stripe zur Zahlungsabwicklung der Abonnements.

## Aktueller Status

**Hinweis:** Die Stripe-Logik ist derzeit im Code noch nicht implementiert.

*   **Abhängigkeiten:** Das Paket `stripe` ist noch nicht in der `package.json` installiert.
*   **Datenbank:** Die notwendigen Felder in der Tabelle `public.shops` sind bereits vorhanden (`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`).
*   **Frontend:** Die Preisseite (`/pricing`) ist rein statisch und verweist aktuell nur auf den Signup-Prozess.

## Geplante Architektur

Die Integration folgt dem Standard-Muster für Next.js Apps mit Supabase:

### 1. Stripe Checkout
Wenn ein Nutzer einen Plan wählt, wird er über eine API-Route zu einer Stripe Checkout Session weitergeleitet.
*   **Logic:** Der `price_id` von Stripe wird an den Endpoint gesendet.
*   **Stripe Customer:** Falls der Shop noch keine `stripe_customer_id` hat, wird in Stripe ein neuer Kunde angelegt und die ID in Supabase gespeichert.

### 2. Webhooks
Stripe sendet Status-Updates (z. B. `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`) an einen Webhook-Endpoint in der App.
*   **Endpoint:** Geplant unter `src/app/api/webhooks/stripe/route.ts`.
*   **Action:** Der Webhook aktualisiert die Spalten `subscription_tier`, `subscription_status` und `stripe_subscription_id` in der `shops` Tabelle basierend auf den Daten von Stripe.

### 3. Customer Portal
Für die Verwaltung des Abos (Kündigen, Plan wechseln, Kreditkarte ändern) wird das **Stripe Customer Portal** verwendet.
*   Ein Button im Admin-Bereich (Einstellungen -> Abrechnung) erzeugt einen Portal-Link über eine Server Action.

## Nächste Schritte zur Implementierung

1.  **Packages installieren:** `npm install stripe`.
2.  **API Keys hinterlegen:** `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` in `.env.local` eintragen.
3.  **Checkout Route:** Erstellen einer API-Route für den Checkout-Start.
4.  **Webhook Handler:** Implementierung des Webhook-Listeners zur Synchronisierung der Datenbank.
5.  **Middleware/Guards:** Sicherstellen, dass Nutzer im `starter` Tier blockiert werden, wenn sie ihr monatliches Order-Limit erreicht haben.

## Zuordnung Stripe-Preise zu Tiers

In `src/config/subscriptions.ts` sollten später die entsprechenden Stripe `price_id`s (für Test und Live) hinterlegt werden:

```typescript
// Beispiel Erweiterung
export const SUBSCRIPTION_TIERS = {
  pro: {
    // ...
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  },
  // ...
};
```
