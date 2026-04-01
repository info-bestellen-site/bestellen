export type Locale = 'de' | 'en' | 'vi' | 'tr'

const de: Record<string, string> = {
  'nav.menu': 'Speisekarte', 'nav.cart': 'Warenkorb', 'nav.home': 'Startseite',
  'menu.title': 'Unsere Speisekarte', 'menu.subtitle': 'Entdecke unsere handverlesene Auswahl an frischen Gerichten.',
  'menu.all': 'Alle', 'menu.not_available': 'Nicht verfügbar',
  'cart.title': 'Dein Warenkorb', 'cart.empty': 'Dein Warenkorb ist leer',
  'cart.empty_hint': 'Füge Gerichte aus der Speisekarte hinzu',
  'cart.items': 'Artikel', 'cart.subtotal': 'Zwischensumme',
  'cart.delivery_fee': 'Liefergebühr', 'cart.total': 'Gesamt',
  'cart.checkout': 'Zur Kasse', 'cart.remove': 'Entfernen', 'cart.free': 'Kostenlos',
  'checkout.title': 'Bestellung aufgeben', 'checkout.review': 'Bestellung prüfen',
  'checkout.delivery_method': 'Abholmethode',
  'checkout.pickup': 'Abholung', 'checkout.delivery': 'Lieferung', 'checkout.dine_in': 'Vor Ort essen',
  'checkout.pickup_time': 'Fertig in ca.', 'checkout.delivery_time': 'Lieferung in ca.',
  'checkout.minutes': 'Min.', 'checkout.customer_details': 'Deine Daten',
  'checkout.name': 'Vollständiger Name', 'checkout.phone': 'Telefonnummer',
  'checkout.address': 'Lieferadresse', 'checkout.table_number': 'Tischnummer',
  'checkout.guest_count': 'Anzahl Gäste', 'checkout.notes': 'Anmerkungen',
  'checkout.notes_placeholder': 'z.B. Allergien, Sonderwünsche...',
  'checkout.place_order': 'Jetzt bestellen',
  'checkout.payment_note': 'Bezahlung vor Ort. Keine Online-Zahlung.',
  'checkout.min_order': 'Mindestbestellwert:',
  'confirmation.title': 'Bestellung aufgegeben!',
  'confirmation.subtitle': 'Vielen Dank für deine Bestellung.',
  'confirmation.order_number': 'Bestellnummer',
  'confirmation.estimated_time': 'Voraussichtliche Wartezeit',
  'confirmation.back_to_menu': 'Zurück zur Speisekarte',
  'product.allergens': 'Allergene', 'product.description': 'Beschreibung',
  'product.add_to_cart': 'In den Warenkorb', 'product.close': 'Schließen',
  'admin.orders': 'Bestellungen', 'admin.menu_management': 'Menü-Verwaltung',
  'admin.settings': 'Einstellungen', 'admin.logout': 'Abmelden',
  'admin.live_orders': 'Live-Bestellungen',
  'admin.live_orders_sub': 'Bestellungen in Echtzeit verwalten.',
  'admin.total_orders': 'Bestellungen gesamt', 'admin.active_now': 'Aktiv jetzt',
  'admin.avg_prep_time': 'Ø Zubereitungszeit', 'admin.revenue_today': 'Umsatz heute',
  'admin.filter_all': 'Alle', 'admin.filter_pending': 'Neu',
  'admin.filter_preparing': 'In Arbeit', 'admin.filter_ready': 'Fertig',
  'admin.filter_completed': 'Abgeschlossen',
  'admin.pending': 'Neu', 'admin.preparing': 'In Arbeit',
  'admin.ready': 'Fertig', 'admin.completed': 'Abgeschlossen', 'admin.cancelled': 'Storniert',
  'admin.no_orders': 'Keine Bestellungen',
  'settings.title': 'Shop-Einstellungen', 'settings.shop_name': 'Shop-Name',
  'settings.stress_factor': 'Stressfaktor (Min. pro Bestellung)',
  'settings.delivery_fee': 'Liefergebühr (€)', 'settings.min_order': 'Mindestbestellwert (€)',
  'settings.is_open': 'Shop ist geöffnet', 'settings.save': 'Speichern', 'settings.saved': 'Gespeichert!',
  'auth.login': 'Anmelden', 'auth.signup': 'Registrieren',
  'auth.email': 'E-Mail', 'auth.password': 'Passwort',
  'auth.login_title': 'Admin-Anmeldung',
  'auth.login_subtitle': 'Melde dich an, um deinen Shop zu verwalten.',
  'auth.signup_title': 'Konto erstellen',
  'auth.signup_subtitle': 'Erstelle ein Konto, um deinen Shop zu starten.',
  'auth.no_account': 'Noch kein Konto?', 'auth.has_account': 'Bereits ein Konto?',
  'onboarding.title': 'Richte deinen Shop ein',
  'onboarding.subtitle': 'In wenigen Schritten bist du startklar.',
  'onboarding.create': 'Shop erstellen', 'onboarding.creating': 'Wird erstellt...',
  'general.loading': 'Laden...', 'general.error': 'Ein Fehler ist aufgetreten',
  'general.closed': 'Geschlossen', 'general.guests': 'Gäste',
  'general.table': 'Tisch', 'general.takeaway': 'Abholung',
}

export const translations: Record<Locale, Record<string, string>> = {
  de,
  en: { ...de, 'nav.menu': 'Menu', 'nav.cart': 'Cart', 'cart.checkout': 'Checkout', 'general.loading': 'Loading...' },
  vi: { ...de, 'nav.menu': 'Thực đơn', 'nav.cart': 'Giỏ hàng', 'general.loading': 'Đang tải...' },
  tr: { ...de, 'nav.menu': 'Menü', 'nav.cart': 'Sepet', 'general.loading': 'Yükleniyor...' },
}

export function t(key: string, locale: Locale = 'de'): string {
  return translations[locale]?.[key] || translations.de[key] || key
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'de'
  return (localStorage.getItem('bestellen-locale') as Locale) || 'de'
}

export function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') localStorage.setItem('bestellen-locale', locale)
}
