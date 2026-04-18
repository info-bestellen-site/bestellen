import Link from 'next/link'
import { ChefHat, ArrowRight, Smartphone, Clock, Zap } from 'lucide-react'

function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/15">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tighter text-primary">Bestellen</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signup" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              Registrieren
            </Link>
            <Link href="/auth/login" className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Anmelden
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-dim mb-4 block">
              Für kleine Gastronomiebetriebe
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-on-surface mb-6 leading-[1.1]">
              Online bestellen,<br />
              <span className="text-primary-dim">direkt genießen.</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10">
              Dein digitales Bestellsystem — kein Telefonstress, keine Fehler.
              Weniger Aufwand hinter der Theke, mehr Umsatz durch ansprechende Bilder.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-full font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95">
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo-sushi" className="inline-flex items-center gap-2 px-8 py-4 bg-surface-container-low text-on-surface rounded-full font-medium text-sm hover:bg-surface-container-high transition-colors">
                Live-Demo ansehen
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: 'Mobile-First', desc: 'Kunden bestellen bequem vom Smartphone — optimiert für jedes Gerät.' },
              { icon: Clock, title: 'Echtzeit-Dashboard', desc: 'Bestellungen sofort auf dem Küchen-Display. Mit akustischem Alarm.' },
              { icon: Zap, title: 'In 5 Minuten startklar', desc: 'Registrieren, Speisekarte einrichten, Link teilen — fertig.' },
            ].map((f, i) => (
              <div key={i} className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
                <f.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/10 py-8 text-center text-xs text-on-surface-variant">
        © {new Date().getFullYear()} Bestellen. Alle Rechte vorbehalten.
      </footer>
    </div>
  )
}

export default HomePage;
