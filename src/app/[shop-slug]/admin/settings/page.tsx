'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shop } from '@/types/database'
import { 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  Euro, 
  Save, 
  Loader2, 
  CheckCircle2,
  Globe
} from 'lucide-react'

export default function SettingsPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const supabase = createClient()
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [stressFactor, setStressFactor] = useState(5)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [minOrder, setMinOrder] = useState(0)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    async function fetchShop() {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', shopSlug)
        .single()
      
      if (data) {
        setShop(data)
        setName(data.name)
        setSlug(data.slug)
        setAddress(data.address || '')
        setPhone(data.phone || '')
        setStressFactor(data.stress_factor)
        setDeliveryFee(data.delivery_fee)
        setMinOrder(data.min_order_amount)
        setIsOpen(data.is_open)
      }
      setLoading(false)
    }
    fetchShop()
  }, [supabase, shopSlug])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    setSaving(true)
    setSuccess(false)

    const { error } = await supabase
      .from('shops')
      .update({
        name,
        slug,
        address,
        phone,
        stress_factor: stressFactor,
        delivery_fee: deliveryFee,
        min_order_amount: minOrder,
        is_open: isOpen
      })
      .eq('id', shop.id)
    
    if (error) {
      alert(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-10 max-w-4xl space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Einstellungen</h1>
        <p className="text-lg text-on-surface-variant font-medium">Shop-Details und Betriebsparameter anpassen.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-20">
        {/* Core Info */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Stammdaten</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Restaurant Name</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Shop URL (Slug)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  required
                  type="text" 
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Anschrift</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  type="text" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Telefonnummer</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Parameters */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Betrieb & Zeiten</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">
                Stressfaktor (Minuten p. Bestellung)
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="1"
                  value={stressFactor}
                  onChange={e => setStressFactor(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-primary font-black text-lg w-16 text-right">{stressFactor} Min.</span>
              </div>
              <p className="mt-2 text-[10px] text-on-surface-variant/50 font-medium italic">
                Wird zur Berechnung der Wartezeit genutzt (Bestellungen × Stressfaktor).
              </p>
            </div>

            <div className="col-span-2 md:col-span-1 md:border-l md:border-outline-variant/5 md:pl-6">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 ml-1">Status</label>
              <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                  isOpen 
                    ? 'bg-success/5 text-success ring-2 ring-inset ring-success/20' 
                    : 'bg-error/5 text-error ring-2 ring-inset ring-error/20'
                }`}
              >
                <span className="text-sm font-black uppercase tracking-widest">{isOpen ? 'Shop Geöffnet' : 'Shop Geschlossen'}</span>
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-error'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Preise & Gebühren</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Liefergebühr (€)</label>
              <input 
                type="number" 
                step="0.50"
                value={deliveryFee}
                onChange={e => setDeliveryFee(parseFloat(e.target.value))}
                className="w-full px-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">Mindestbestellwert (€)</label>
              <input 
                type="number" 
                step="0.50"
                value={minOrder}
                onChange={e => setMinOrder(parseFloat(e.target.value))}
                className="w-full px-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-10 right-10 z-50">
          <button
            disabled={saving}
            className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-2xl ${
              success 
                ? 'bg-success text-white' 
                : 'bg-primary text-on-primary shadow-primary/20 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {success ? 'Gespeichert!' : 'Einstellungen Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
