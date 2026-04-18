import { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'Bestellen — Die Gastro-Revolution | Blitzschnell & Effizient',
  description: 'Bestelle dein Lieblingsessen online und hole es ab oder lass es liefern. Digitalisiere dein Restaurant in weniger als 5 Minuten. Modernes Video-Sourcing und intuitives Design.',
}

function RootPage() {
  return <LandingClient />
}

export default RootPage;
