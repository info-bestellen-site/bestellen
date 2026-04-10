# Subscription-Übersicht

Diese Dokumentation beschreibt die verschiedenen Abonnement-Stufen (Tiers) von Bestellen.io und deren technische Implementierung.

## Verfügbare Tiers

Das System unterstützt aktuell drei Stufen, die in der Datenbank als Enum `subscription_tier` definiert sind:

1.  **`starter` (Das Zuckerl)**
    *   **Fokus:** Testen & Erste Schritte.
    *   **Preis:** 0€
    *   **Limit:** 100 Bestellungen pro Monat.
    *   **Features:** Grundlegendes Menü, Standard-Design, "Powered by" Branding.

2.  **`pro` (Business)**
    *   **Fokus:** Wachsen & Professionalisieren.
    *   **Preis:** 39€
    *   **Limit:** Unbegrenzte Bestellungen.
    *   **Features:** Reservierungen, eigenes Branding (kein "Bestellen.io" Logo), Premium Support.

3.  **`max` (AI-Max)**
    *   **Fokus:** Automatisieren & Skalieren.
    *   **Preis:** 89€
    *   **Limit:** Unbegrenzte Bestellungen.
    *   **Features:** Alle Pro-Features + Analytics Dashboard, Smart-Marketing Tools, KI-Telefon-Agent.

## Technische Ablageorte

### 1. Code-Konfiguration
Die zentrale Definition der Tiers und ihrer Features befindet sich in:
`src/config/subscriptions.ts`

Hier werden die Namen, Preise, Limits und Feature-Listen für jede Stufe gemappt.

### 2. Datenbank-Schema
In der Supabase-Datenbank ist der Plan eines Shops in der Tabelle `shops` hinterlegt:
*   **Tabelle:** `public.shops`
*   **Spalte:** `subscription_tier` (Enum: `starter`, `pro`, `max`)
*   **Spalte:** `subscription_status` (Status des Abos)

### 3. Anzeige (Frontend)
Die Preisseite, die diese Informationen für Endkunden aufbereitet, liegt unter:
`src/app/pricing/page.tsx`

Die Features werden dort über eine `FEATURES_MATRIX` mit der Konfiguration in `src/config/subscriptions.ts` abgeglichen.

## Sortierung
Die Tiers sind in der `SUBSCRIPTION_TIERS` Map in `src/config/subscriptions.ts` definiert. Die logische Reihenfolge (Starter -> Pro -> Max) wird im Frontend durch die Reihenfolge der Anzeige in der `PricingPage` und im Vergleichs-Matrix-Array eingehalten.
