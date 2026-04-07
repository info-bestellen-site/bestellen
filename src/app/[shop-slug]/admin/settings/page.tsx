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
  Globe,
  Plus,
  Trash2,
  Users,
  LayoutGrid,
  ShieldAlert,
  Image as ImageIcon,
  Upload,
  Coffee,
  Pizza,
  Utensils,
  Beer,
  Cake,
  IceCream,
  Fish,
  Soup,
  Beef,
  Wine,
  ChevronDown
} from 'lucide-react'
import { OpeningHour, Table as ShopTable } from '@/types/database'
import { DAYS_OF_WEEK, DAY_KEYS } from '@/lib/utils/open-hours'
import { useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { LANGUAGES, Language } from '@/lib/i18n/translations'

const PRESET_ICONS = [
  { name: 'Store', icon: Store },
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
  { name: 'Pizza', icon: Pizza },
  { name: 'Beer', icon: Beer },
  { name: 'Cake', icon: Cake },
  { name: 'IceCream', icon: IceCream },
  { name: 'Fish', icon: Fish },
  { name: 'Soup', icon: Soup },
  { name: 'Beef', icon: Beef },
  { name: 'Wine', icon: Wine },
]

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
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [minOrder, setMinOrder] = useState(0)
  const [isOpen, setIsOpen] = useState(true)
  const [manualStatusUpdatedAt, setManualStatusUpdatedAt] = useState<string | null>(null)
  const [hasDelivery, setHasDelivery] = useState(true)
  const [hasPickup, setHasPickup] = useState(true)
  const [hasDineIn, setHasDineIn] = useState(true)
  const [hasReservation, setHasReservation] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [iconName, setIconName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { t } = useTranslation()
  
  const [isUploading, setIsUploading] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Opening Hours State
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([])
  const [newSlot, setNewSlot] = useState({ day: 0, start: '09:00', end: '18:00' })

  // Tables State
  const [tables, setTables] = useState<ShopTable[]>([])
  const [newTable, setNewTable] = useState({ number: '', capacity: 2 })

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
        setDeliveryFee(data.delivery_fee)
        setMinOrder(data.min_order_amount)
        setIsOpen(data.is_open)
        setHasDelivery(data.has_delivery)
        setHasPickup(data.has_pickup)
        setHasDineIn(data.has_dine_in)
        setHasReservation(data.has_reservation ?? true)
        setManualStatusUpdatedAt(data.manual_status_updated_at)
        setLogoUrl(data.logo_url)
        setIconName(data.icon_name)
      }
      setLoading(false)
    }

    async function fetchHours() {
      const { data } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('shop_id', (await supabase.from('shops').select('id').eq('slug', shopSlug).single()).data?.id || '')
        .order('start_time')
      if (data) setOpeningHours(data)
    }

    async function fetchTables() {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('shop_id', (await supabase.from('shops').select('id').eq('slug', shopSlug).single()).data?.id || '')
        .order('name')
      if (data) setTables(data)
    }

    fetchShop()
    fetchHours()
    fetchTables()
  }, [supabase, shopSlug])

  const handleAddSlot = async () => {
    if (!shop) return
    const { data, error } = await supabase
      .from('opening_hours')
      .insert({
        shop_id: shop.id,
        day_of_week: newSlot.day,
        start_time: newSlot.start + ':00',
        end_time: newSlot.end + ':00'
      })
      .select()
      .single()
    
    if (data) setOpeningHours([...openingHours, data])
    if (error) alert(error.message)
  }

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase.from('opening_hours').delete().eq('id', id)
    if (!error) setOpeningHours(openingHours.filter(h => h.id !== id))
  }

  const handleAddTable = async () => {
    if (!shop || !newTable.number) return
    const { data, error } = await supabase
      .from('tables')
      .insert({
        shop_id: shop.id,
        name: newTable.number,
        capacity: newTable.capacity
      })
      .select()
      .single()
    
    if (data) {
      setTables([...tables, data])
      setNewTable({ number: '', capacity: 2 })
    }
    if (error) alert(error.message)
  }

  const handleDeleteTable = async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id)
    if (!error) setTables(tables.filter(t => t.id !== id))
  }

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
        has_pickup: hasPickup,
        has_reservation: hasReservation,
        is_open: isOpen,
        manual_status_updated_at: manualStatusUpdatedAt,
        min_order_amount: minOrder,
        delivery_fee: deliveryFee,
        has_delivery: hasDelivery,
        logo_url: logoUrl,
        icon_name: iconName
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = async (croppedBlob: Blob) => {
    if (!shop) return
    setIsUploading(true)
    setImageToCrop(null)

    const fileName = `${shop.id}/logo_${Math.random()}.jpg`
    const filePath = `shop-logos/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(filePath)

      setLogoUrl(publicUrl)
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      setError(error.message || t('upload_failed'))
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="p-4 sm:p-10 max-w-4xl mx-auto space-y-6 sm:space-y-10">
      <div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">{t('settings')}</h1>
        <p className="text-sm sm:text-lg text-on-surface-variant font-medium">{t('settings_subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-20">
        {/* Core Info */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('master_data')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('restaurant_name')}</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('shop_url_slug')}</label>
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('address_label')}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input 
                  type="text" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('address_placeholder')}
                  className="w-full pl-11 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('phone_label')}</label>
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

        {/* Branding Section */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('branding_logo')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{t('custom_logo')}</label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-surface-container-low overflow-hidden border-2 border-outline-variant/10 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-on-surface-variant/20" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-on-surface">{t('upload_logo')}</p>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {t('logo_hint')}
                  </p>
                  {logoUrl && (
                    <button 
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="text-[10px] font-bold text-error uppercase tracking-widest hover:underline"
                    >
                      {t('remove_logo')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{t('alternative_icon')}</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {PRESET_ICONS.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIconName(item.name)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        iconName === item.name 
                          ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-110' 
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed italic">
                {t('icon_hint')}
              </p>
            </div>
          </div>
        </div>

        {/* Features Config */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('shop_features')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <button 
              type="button"
              onClick={() => setHasDelivery(!hasDelivery)}
              className={`flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${
                hasDelivery ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/10 bg-surface text-on-surface-variant'
              }`}
            >
              <div className="text-left">
                <p className="font-bold">{t('delivery')}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {hasDelivery ? t('activated') : t('deactivated')}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${hasDelivery ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            </button>

            <button 
              type="button"
              onClick={() => setHasPickup(!hasPickup)}
              className={`flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${
                hasPickup ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/10 bg-surface text-on-surface-variant'
              }`}
            >
              <div className="text-left">
                <p className="font-bold">{t('pickup')}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {hasPickup ? t('activated') : t('deactivated')}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${hasPickup ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            </button>


            <button 
              type="button"
              onClick={() => setHasReservation(!hasReservation)}
              className={`flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${
                hasReservation ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/10 bg-surface text-on-surface-variant'
              }`}
            >
              <div className="text-left">
                <p className="font-bold">{t('reservation_feature')}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {hasReservation ? t('activated') : t('deactivated')}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${hasReservation ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            </button>
            
          </div>
        </div>

        {/* Operating Parameters */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('operating_times_title')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">

            <div className="col-span-2 md:col-span-1 md:border-l md:border-outline-variant/5 md:pl-8">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 ml-1">{t('manual_status_override')}</label>
              <button 
                type="button"
                onClick={() => {
                  setIsOpen(!isOpen)
                  setManualStatusUpdatedAt(new Date().toISOString())
                }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all ${
                  isOpen 
                    ? 'bg-success/5 text-success ring-2 ring-inset ring-success/20' 
                    : 'bg-error/5 text-error ring-2 ring-inset ring-error/20'
                }`}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-black uppercase tracking-widest leading-none mb-1">
                    {isOpen ? t('open') : t('closed')}
                  </span>
                  <span className="text-[10px] font-bold opacity-60">{t('manual_switch')}</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-error'}`} />
              </button>
              <p className="mt-4 text-[10px] text-on-surface-variant/50 font-medium italic">
                {t('manual_switch_hint')}
              </p>
            </div>

          </div>
        </div>

        {/* Opening Hours Section */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('opening_hours_subtitle')}</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low/50 p-6 rounded-3xl border border-outline-variant/5">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('new_time_slot')}</p>
                <div className="grid grid-cols-3 gap-3">
                  <select 
                    value={newSlot.day}
                    onChange={e => setNewSlot({...newSlot, day: parseInt(e.target.value)})}
                    className="col-span-3 px-4 py-3 bg-white rounded-xl text-sm font-bold border-none ring-1 ring-outline-variant/10"
                  >
                    {DAYS_OF_WEEK.map((day, i) => <option key={i} value={i}>{t(DAY_KEYS[i])}</option>)}
                  </select>
                  <input 
                    type="time" 
                    value={newSlot.start}
                    onChange={e => setNewSlot({...newSlot, start: e.target.value})}
                    className="px-4 py-3 bg-white rounded-xl text-sm font-bold border-none ring-1 ring-outline-variant/10"
                  />
                  <input 
                    type="time" 
                    value={newSlot.end}
                    onChange={e => setNewSlot({...newSlot, end: e.target.value})}
                    className="px-4 py-3 bg-white rounded-xl text-sm font-bold border-none ring-1 ring-outline-variant/10"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSlot}
                    className="bg-primary text-on-primary rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {DAYS_OF_WEEK.map((day, dayIdx) => {
                const daySlots = openingHours.filter(h => Number(h.day_of_week) === dayIdx)
                return (
                  <div key={dayIdx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/5 group">
                    <span className="text-sm font-bold w-32">{t(DAY_KEYS[dayIdx])}</span>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {daySlots.length > 0 ? (
                        daySlots.map(slot => (
                          <div key={slot.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-full border border-primary/10">
                            <span className="text-[11px] font-black">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                            <button 
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="hover:text-error transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] font-bold text-on-surface-variant/30 uppercase tracking-widest italic">{t('closed')}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('table_management')}</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-low/50 p-6 rounded-3xl border border-outline-variant/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">{t('add_table')}</p>
              <div className="flex gap-4">
                <input 
                  placeholder={t('table_name_nr')}
                  value={newTable.number}
                  onChange={e => setNewTable({...newTable, number: e.target.value})}
                  className="flex-1 px-4 py-3 bg-white rounded-xl text-sm font-bold border-none ring-1 ring-outline-variant/10"
                />
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl ring-1 ring-outline-variant/10">
                  <Users className="w-4 h-4 text-on-surface-variant/40" />
                  <input 
                    type="number"
                    min="1"
                    value={newTable.capacity}
                    onChange={e => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                    className="w-12 text-sm font-bold border-none p-0 focus:ring-0"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddTable}
                  className="px-6 bg-primary text-on-primary rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Hinzufügen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tables.map(table => (
                <div key={table.id} className="p-5 bg-white rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all relative group">
                  <button 
                    type="button"
                    onClick={() => handleDeleteTable(table.id)}
                    className="absolute top-4 right-4 text-on-surface-variant/20 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">{t('table')}</p>
                  <p className="text-xl font-black mb-4">{table.name}</p>
                  <div className="flex items-center gap-1.5 pt-4 border-t border-outline-variant/5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold">{table.capacity} {t('places')}</span>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: Math.min(table.capacity, 4) }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                      ))}
                      {table.capacity > 4 && <span className="text-[8px] font-black text-primary/40">+</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/10 shadow-xl shadow-primary/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('pricing_fees')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('delivery_fee_label')}</label>
              <input 
                type="number" 
                step="0.50"
                value={deliveryFee}
                onChange={e => setDeliveryFee(parseFloat(e.target.value))}
                className="w-full px-4 py-4 bg-surface-container-low border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5 ml-1">{t('min_order_label')}</label>
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
        <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50">
          <button
            disabled={saving}
            className={`flex items-center gap-3 px-6 sm:px-10 py-4 sm:py-5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-2xl ${
              success 
                ? 'bg-success text-white' 
                : 'bg-primary text-on-primary shadow-primary/20 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {success ? t('saved_success') : t('save_settings')}
          </button>
        </div>
      </form>

      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {imageToCrop && (
        <ImageCropper 
          image={imageToCrop} 
          onCancel={() => setImageToCrop(null)}
          onCropComplete={onCropComplete}
          aspectRatio={1}
          circularCrop={true}
        />
      )}

      {error && (
        <Modal 
          isOpen={!!error} 
          onClose={() => setError(null)} 
          title={t('error')}
        >
          <div className="p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-widest text-error">{t('upload_failed')}</p>
              <p className="text-on-surface-variant text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="w-full py-4 bg-surface-container-high rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
