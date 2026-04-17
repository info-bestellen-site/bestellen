'use client'

import { useState, useEffect, use } from 'react'
import { useCartStore, EMPTY_ITEMS } from '@/lib/store/cart-store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { calculateWaitTime, formatWaitTime } from '@/lib/utils/calculate-wait-time'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Clock, 
  Store, 
  Truck, 
  Utensils,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { Shop, FulfillmentType, OpeningHour, Table, Order } from '@/types/database'
import { generateAvailableSlots, getAvailableReservationSlots, isShopOpen } from '@/lib/utils/open-hours'
import { PayPalCheckout } from '@/components/checkout/PayPalCheckout'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Modal } from '@/components/ui/Modal'

export default function CheckoutPage({ params }: { params: Promise<{ 'shop-slug': string }> }) {
  const { 'shop-slug': shopSlug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const items = useCartStore(s => s.carts[shopSlug] || EMPTY_ITEMS)
  const { removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore()
  const { t } = useTranslation()
  
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [activeOrders, setActiveOrders] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Form state
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryZip, setDeliveryZip] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [notes, setNotes] = useState('')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'paypal'>('cash')
  const [paypalSuccess, setPaypalSuccess] = useState(false)
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false)
  const [paypalAddressInfo, setPaypalAddressInfo] = useState<{ name: string, address: string, orderId: string } | null>(null)
  const [forceShowAddressFields, setForceShowAddressFields] = useState(false)

  // Admin specific form state
  const [adminFulfillment, setAdminFulfillment] = useState<'terminal' | 'table'>('terminal')
  const [adminSelectedTable, setAdminSelectedTable] = useState<string>('')
  
  // Reset confirmation state when type or method changes
  useEffect(() => {
    setForceShowAddressFields(false)
    setPaypalAddressInfo(null)
  }, [fulfillmentType, paymentMethod])
  
  // Booking State
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [existingOrders, setExistingOrders] = useState<Order[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [guestCount, setGuestCount] = useState(2)

  useEffect(() => {
    async function init() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', shopSlug)
        .single()
      
      if (shopData) {
        setShop(shopData)

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        const isOwner = user?.id === shopData.owner_id
        setIsAdmin(isOwner)
        
        let defaultType: FulfillmentType = 'pickup'
        if (shopData.has_pickup) defaultType = 'pickup'
        else if (shopData.has_delivery) defaultType = 'delivery'
        else if (shopData.has_dine_in) defaultType = 'dine_in'
        setFulfillmentType(defaultType)
        
        // Fetch active orders for wait time calculation
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopData.id)
          .in('status', ['pending', 'preparing'])
        setActiveOrders(count || 0)
        
        // Fetch opening hours
        const { data: hoursData } = await supabase
          .from('opening_hours')
          .select('*')
          .eq('shop_id', shopData.id)
          
        // Fetch table layouts
        const { data: tablesData } = await supabase
          .from('tables')
          .select('*')
          .eq('shop_id', shopData.id)
          
        // Fetch existing dine-in bookings for the current day
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('fulfillment_type', 'dine_in')
          .gte('estimated_ready_at', todayStr + 'T00:00:00Z')
        
        if (hoursData) setOpeningHours(hoursData)
        if (tablesData) setTables(tablesData)
        if (ordersData) setExistingOrders(ordersData)
      }
      setLoading(false)
    }
    init()
  }, [shopSlug, supabase])

  const subtotal = getSubtotal(shopSlug)
  const deliveryFee = fulfillmentType === 'delivery' ? (shop?.delivery_fee || 0) : 0
  const total = subtotal + deliveryFee
  const isMinOrderViolation = !isAdmin && fulfillmentType === 'delivery' && subtotal < (shop?.min_order_amount || 0)
  const waitTime = calculateWaitTime(activeOrders, items)

  const availableSlots = getAvailableReservationSlots(openingHours, tables, existingOrders, guestCount)
  
  // Ensure we have a valid slot selected dynamically
  useEffect(() => {
    if (fulfillmentType === 'dine_in' && availableSlots.length > 0) {
      if (!selectedSlot || !availableSlots.includes(selectedSlot)) {
        setSelectedSlot(availableSlots[0])
      }
    }
  }, [availableSlots, selectedSlot, fulfillmentType])

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop || items.length === 0) return

    if (isMinOrderViolation) {
      alert(`Mindestbestellwert von ${formatCurrency(shop.min_order_amount)} nicht erreicht.`)
      return
    }

    if (fulfillmentType === 'delivery' && shop.delivery_zip_codes && shop.delivery_zip_codes.length > 0) {
      const isZipAllowed = (shop.delivery_zip_codes || []).some(z => {
        const zipPart = z.split(':')[0]
        return zipPart === deliveryZip
      })

      if (!isZipAllowed) {
        alert(t('delivery_not_available'))
        return
      }
    }

    if (orderLoading) return

    // Special handling for PayPal: we now use the PayPalButtons directly
    if (paymentMethod === 'paypal' && !isAdmin) {
      return
    }

    setOrderLoading(true)
    try {
      // Final check if shop is still open
      const { data: latestShop } = await supabase.from('shops').select('is_open, manual_status_updated_at').eq('id', shop.id).single()
      const { data: hours } = await supabase.from('opening_hours').select('*').eq('shop_id', shop.id)
      if (!isShopOpen(hours || [], latestShop?.is_open ?? false, latestShop?.manual_status_updated_at)) {
        alert('Der Shop hat gerade geschlossen. Ihre Bestellung konnte nicht aufgegeben werden.')
        window.location.reload()
        return
      }

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: shop.id,
          customer_name: isAdmin ? 'Admin' : customerName,
          customer_phone: isAdmin ? (shop.phone || 'Admin') : customerPhone,
          delivery_address: (!isAdmin && fulfillmentType === 'delivery' && (deliveryStreet || deliveryZip || deliveryCity)) 
            ? `${deliveryStreet}, ${deliveryZip} ${deliveryCity}` 
            : null,
          table_number: (isAdmin && adminFulfillment === 'table') ? adminSelectedTable : null,
          fulfillment_type: isAdmin 
            ? (adminFulfillment === 'table' ? 'dine_in' : 'pickup')
            : fulfillmentType,
          subtotal,
          delivery_fee: isAdmin ? 0 : deliveryFee,
          total: isAdmin ? subtotal : total,
          notes,
          estimated_ready_at: (!isAdmin && fulfillmentType === 'dine_in' && selectedSlot)
            ? new Date(new Date().setHours(parseInt(selectedSlot.split(':')[0]), 0, 0, 0)).toISOString()
            : new Date(Date.now() + waitTime * 60000).toISOString(),
          guest_count: (!isAdmin && fulfillmentType === 'dine_in') ? guestCount : null,
          status: 'pending',
          payment_method: isAdmin ? 'cash' : paymentMethod,
          payment_status: (isAdmin || paymentMethod === 'cash') ? 'unpaid' : 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order items
      const orderItems = items.map(item => {
        const modifierSummary = item.selectedModifiers && item.selectedModifiers.length > 0
          ? ` (${item.selectedModifiers.map(m => m.optionName).join(', ')})`
          : ''
        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name + modifierSummary,
          quantity: item.quantity,
          unit_price: item.totalPrice,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // For cash or admin: clear cart and redirect immediately
      clearCart(shopSlug)
      router.push(`/${shop.slug}/confirmation/${order.id}`)
    } catch (err: any) {
      console.error('Error placing order:', err)
      // Log more details for Supabase errors
      if (err?.message) {
        console.error('Error message:', err.message)
        console.error('Error details:', err.details)
        console.error('Error hint:', err.hint)
        console.error('Error code:', err.code)
      }
      alert('Bestellung konnte nicht aufgegeben werden. Bitte versuchen Sie es erneut.')
    } finally {
      setOrderLoading(false)
    }
  }

  const validateForPayPal = async (): Promise<boolean> => {
    if (!customerPhone) {
      alert('Bitte geben Sie Ihre Telefonnummer für Rückfragen an.')
      return false
    }
    
    // Name and address are now optional for PayPal Express as we get them from PayPal.
    // However, if the user already filled them, we use them.
    
    return true
  }

  const getOrderData = () => ({
    shop_id: shop!.id,
    customer_name: customerName,
    customer_phone: customerPhone,
    delivery_address: (fulfillmentType === 'delivery' && (deliveryStreet || deliveryZip || deliveryCity)) 
      ? `${deliveryStreet}, ${deliveryZip} ${deliveryCity}` 
      : null,
    fulfillment_type: fulfillmentType,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    notes,
    estimated_ready_at: (fulfillmentType === 'dine_in' && selectedSlot)
      ? new Date(new Date().setHours(parseInt(selectedSlot.split(':')[0]), 0, 0, 0)).toISOString()
      : new Date(Date.now() + waitTime * 60000).toISOString(),
    guest_count: fulfillmentType === 'dine_in' ? guestCount : null,
    items: items,
  })

  const handlePayPalSuccess = async (paypalOrderId: string) => {
    // If the user has explicitly chosen to show/edit address fields, 
    // we use their manual input and bypass the PayPal address confirmation.
    if (forceShowAddressFields) {
      await completeOrder(paypalOrderId)
      return
    }

    // 1. Fetch address from PayPal first
    setIsVerifyingAddress(true)
    try {
      const res = await fetch(`/api/paypal/get-order-details?orderId=${paypalOrderId}`)
      const info = await res.json()
      
      if (res.ok && info.address) {
        setPaypalAddressInfo({
          name: info.customerName,
          address: info.address,
          orderId: paypalOrderId
        })
      } else {
        // Fallback: just complete the order if no address returned or error
        await completeOrder(paypalOrderId)
      }
    } catch (err) {
      console.error('Error fetching PayPal address:', err)
      await completeOrder(paypalOrderId)
    } finally {
      setIsVerifyingAddress(false)
    }
  }

  const completeOrder = async (paypalOrderId: string) => {
    setOrderLoading(true)
    try {
      const res = await fetch('/api/paypal/complete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId,
          orderData: getOrderData(),
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setPaypalSuccess(true)
      clearCart(shopSlug)
      router.push(`/${shop!.slug}/confirmation/${result.orderId}`)
    } catch (err: any) {
      console.error('PayPal completion error:', err)
      alert(err.message || 'Payment capture failed')
    } finally {
      setOrderLoading(false)
    }
  }

  const handlePayPalError = (error: string) => {
    console.error('PayPal error:', error)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  if (items.length === 0) return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-8 h-8 text-on-surface-variant/30" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Dein Warenkorb ist leer</h2>
      <p className="text-on-surface-variant mb-10">Füge Gerichte aus der Speisekarte hinzu, um fortzufahren.</p>
      <Link href={`/${shopSlug}`} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-full font-semibold text-sm">
        <ChevronLeft className="w-4 h-4" />
        Zurück zur Speisekarte
      </Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${shopSlug}`} className="w-10 h-10 rounded-full bg-white border border-outline-variant/10 flex items-center justify-center hover:bg-surface-container-low transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Bestellung prüfen</h1>
      </div>

      <div className="space-y-6">
        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Deine Auswahl</h3>
          <div className="divide-y divide-outline-variant/5">
            {items.map((item) => (
              <div key={item.cartItemKey} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.product.name}</h4>
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <p className="text-xs text-primary/70 font-medium mt-0.5">
                      {item.selectedModifiers.map(m => m.optionName).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant font-medium">{formatCurrency(item.totalPrice)}</p>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-low px-2 py-1 rounded-full">
                  <button onClick={() => updateQuantity(item.cartItemKey, item.quantity - 1, shopSlug)} className="p-1 hover:text-primary transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartItemKey, item.quantity + 1, shopSlug)} className="p-1 hover:text-primary transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.cartItemKey, shopSlug)} className="text-error-dim/40 hover:text-error transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Selection (Regular Customer) */}
        {!isAdmin && (
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Wie möchtest du bestellen?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ...(shop?.has_pickup ? [{ id: 'pickup', label: 'Abholung', icon: Store }] : []),
                ...(shop?.has_delivery ? [{ id: 'delivery', label: 'Lieferung', icon: Truck }] : []),
                ...(shop?.has_dine_in ? [{ id: 'dine_in', label: 'Vor Ort', icon: Utensils }] : []),
              ].filter(type => type.id !== 'dine_in').map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFulfillmentType(type.id as FulfillmentType)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    fulfillmentType === type.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-transparent bg-surface-container-low text-on-surface-variant grayscale opacity-60'
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Admin Specific Selection */}
        {isAdmin && (
          <div className="bg-white rounded-[2rem] p-8 border border-primary/20 shadow-xl shadow-primary/5 animate-[fadeIn_0.3s_ease] space-y-8">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest">Admin-Modus: Schnellbestellung</h3>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">Wähle die Art der Bereitstellung für diese Bestellung.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAdminFulfillment('terminal')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                  adminFulfillment === 'terminal' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant/40'
                }`}
              >
                <div className={`p-3 rounded-xl ${adminFulfillment === 'terminal' ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant/20'}`}>
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Abholung Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminFulfillment('table')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                  adminFulfillment === 'table' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant/40'
                }`}
              >
                <div className={`p-3 rounded-xl ${adminFulfillment === 'table' ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant/20'}`}>
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Lieferung am Tisch</span>
              </button>
            </div>

            {adminFulfillment === 'table' && (
              <div className="animate-[fadeIn_0.2s_ease]">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Tisch Auswählen</label>
                <select
                  required
                  value={adminSelectedTable}
                  onChange={(e) => setAdminSelectedTable(e.target.value)}
                  className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Tisch wählen --</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.name}>
                      Tisch {table.name} ({table.capacity} Personen)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Time Slot Selection */}
        {fulfillmentType === 'dine_in' && !isAdmin && (
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Wann möchtest du kommen?</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableSlots.length > 0 ? (
                availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      selectedSlot === slot 
                        ? 'border-primary bg-primary text-on-primary' 
                        : 'border-outline-variant/10 hover:border-primary/30'
                    }`}
                  >
                    {slot}
                  </button>
                ))
              ) : (
                <p className="text-xs text-error font-medium italic">Für diese Personenanzahl sind leider keine Plätze mehr frei.</p>
              )}
            </div>
            <p className="mt-3 text-[10px] text-on-surface-variant/50 font-semibold italic">
              * Termine werden in 1-Stunden-Fenstern vergeben.
            </p>
          </div>
        )}

        {/* Guest Count (Dine In only) */}
        {fulfillmentType === 'dine_in' && !isAdmin && (
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-1">Personenanzahl</h3>
                <p className="text-[10px] text-on-surface-variant/60 font-medium">Für wie viele Personen sollen wir decken?</p>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="p-1 hover:text-primary transition-colors text-on-surface-variant"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-lg font-black w-6 text-center">{guestCount}</span>
                <button 
                  type="button"
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="p-1 hover:text-primary transition-colors text-on-surface-variant"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Checkout Form */}
        <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            {isAdmin ? 'Optionale Anmerkungen' : 'Deine Daten'}
          </h3>
          
          <div className="space-y-4">
            {(!isAdmin && (fulfillmentType !== 'delivery' || paymentMethod !== 'paypal' || forceShowAddressFields)) && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Vollständiger Name</label>
                    <input 
                      required
                      type="text" 
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Telefonnummer</label>
                    <input 
                      required
                      type="tel" 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Für Rückfragen bei der Bestellung"
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="animate-[fadeIn_0.3s_ease] space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">{t('street_and_number')}</label>
                      <input 
                        required
                        type="text" 
                        value={deliveryStreet}
                        onChange={e => setDeliveryStreet(e.target.value)}
                        placeholder="Musterstraße 123"
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">{t('postal_code')}</label>
                        <input 
                          required
                          type="text" 
                          value={deliveryZip}
                          onChange={e => setDeliveryZip(e.target.value)}
                          placeholder="12345"
                          className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">{t('city')}</label>
                        <input 
                          required
                          type="text" 
                          value={deliveryCity}
                          onChange={e => setDeliveryCity(e.target.value)}
                          placeholder="Berlin"
                          className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {(!isAdmin && fulfillmentType === 'delivery' && paymentMethod === 'paypal' && !forceShowAddressFields) && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 animate-[fadeIn_0.3s_ease]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">PayPal Express</p>
                </div>
                <p className="text-sm font-medium text-on-surface">Deine Lieferadresse wird automatisch von PayPal übernommen.</p>
                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Telefonnummer (erforderlich)</label>
                  <input 
                    required
                    type="tel" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Für Rückfragen"
                    className="w-full px-4 py-3 bg-white border border-primary/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            )}


            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">Anmerkungen (Optional)</label>
              <textarea 
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Allergien, Sonderwünsche..."
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          {!isAdmin && shop?.paypal_enabled && shop?.paypal_merchant_id && (
            <div className="pt-4 border-t border-outline-variant/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">{t('payment_method_title')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant/40 hover:border-primary/30 grayscale'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('cash_on_arrival')}</span>
                  <span className="text-[9px] font-medium opacity-70">{t('pay_on_site')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant/40 hover:border-primary/30 grayscale'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PayPal</span>
                  <span className="text-[9px] font-medium opacity-70">{t('pay_online')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-outline-variant/10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-on-surface-variant font-medium">Zwischensumme</span>
              <span className="text-sm text-on-surface font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {fulfillmentType === 'delivery' && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-on-surface-variant font-medium">Liefergebühr</span>
                <span className="text-sm text-on-surface font-semibold">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 mb-6">
              <span className="text-base font-bold">Gesamtbetrag</span>
              <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
            </div>

            {isMinOrderViolation && (
              <div className="flex items-center gap-2 p-3 bg-surface-container-low text-error rounded-lg text-xs font-semibold mb-4">
                <AlertCircle className="w-4 h-4" />
                Mindestbestellwert von {formatCurrency(shop?.min_order_amount || 0)} nicht erreicht.
              </div>
            )}

            {/* Improved PayPal flow: show buttons immediately */}
            {!isAdmin && paymentMethod === 'paypal' && shop?.paypal_enabled ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    {t('complete_paypal_payment')}
                  </p>
                  <p className="text-[9px] text-primary/60 font-bold mt-1 uppercase tracking-wider">
                    ⚡ Express: Name & Adresse werden von PayPal übernommen
                  </p>
                </div>
                <PayPalCheckout
                  shopSlug={shopSlug}
                  amount={total}
                  orderData={getOrderData()}
                  onBeforeCreate={validateForPayPal}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                  allowedZipCodes={(shop?.delivery_zip_codes || []).map(z => z.split(':')[0])}
                />
              </div>
            ) : (
              <>
                <button
                  disabled={orderLoading || isMinOrderViolation}
                  className="w-full py-4 bg-primary text-on-primary rounded-full font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                >
                  {orderLoading ? (
                    <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {fulfillmentType === 'dine_in' ? t('reserve_button') : t('order_now_button')}
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-4">
                  {paymentMethod === 'paypal' ? t('continue_to_paypal') : t('payment_at_restaurant_notice')}
                </p>
              </>
            )}
          </div>
        </form>
      </div>
      
      {/* Address Confirmation Modal */}
      <Modal
        isOpen={!!paypalAddressInfo}
        onClose={() => setPaypalAddressInfo(null)}
        title="Lieferadresse bestätigen"
      >
        <div className="space-y-6">
          <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">Adresse von PayPal</p>
            <div className="space-y-1">
              <p className="font-bold text-lg">{paypalAddressInfo?.name}</p>
              <p className="text-on-surface-variant font-medium">{paypalAddressInfo?.address}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                const id = paypalAddressInfo?.orderId
                if (id) completeOrder(id)
                setPaypalAddressInfo(null)
              }}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Diese Adresse verwenden
            </button>
            <button
              onClick={() => {
                setForceShowAddressFields(true)
                setPaypalAddressInfo(null)
              }}
              className="w-full py-4 bg-white text-on-surface-variant border-2 border-outline-variant/10 rounded-2xl font-bold text-sm hover:bg-surface-container-low transition-all"
            >
              Adresse ändern
            </button>
          </div>
        </div>
      </Modal>

      {/* Global verification loading state */}
      {isVerifyingAddress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-on-surface">Lade Adresse von PayPal...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
