'use client'

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useState } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'

interface PayPalCheckoutProps {
  shopSlug: string
  amount: number
  orderData: {
    shop_id: string
    customer_name: string
    customer_phone: string
    delivery_address: string | null
    fulfillment_type: string
    subtotal: number
    delivery_fee: number
    total: number
    notes: string
    estimated_ready_at: string
    guest_count: number | null
    items: any[]
  }
  onSuccess: (paypalOrderId: string, supabaseOrderId: string) => void
  onError: (error: string) => void
  onBeforeCreate?: () => Promise<boolean>
  disabled?: boolean
  allowedZipCodes?: string[]
}

export function PayPalCheckout({
  shopSlug,
  amount,
  orderData,
  onSuccess,
  onError,
  onBeforeCreate,
  disabled,
  allowedZipCodes = [],
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error/5 text-error rounded-2xl border border-error/10">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p className="text-xs font-semibold">PayPal is not configured. Please contact the shop owner.</p>
      </div>
    )
  }

  return (
    <div className="relative z-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-error/5 text-error rounded-xl border border-error/10">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      <PayPalScriptProvider
        options={{
          clientId,
          currency: 'EUR',
          intent: 'capture',
        }}
      >
        <PayPalButtons
          fundingSource="paypal"
          disabled={disabled}
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'pill',
            label: 'paypal',
            height: 55,
            tagline: false,
          }}
          onInit={() => setLoading(false)}
          onClick={async (data, actions) => {
            if (onBeforeCreate) {
              const isValid = await onBeforeCreate()
              if (!isValid) {
                return actions.reject()
              }
            }
            return actions.resolve()
          }}
          onShippingChange={async (data, actions) => {
            if (orderData.fulfillment_type !== 'delivery') return actions.resolve()
            
            const zip = data.shipping_address.postal_code
            if (allowedZipCodes.length > 0 && !allowedZipCodes.includes(zip)) {
              return actions.reject()
            }
            
            return actions.resolve()
          }}
          createOrder={async () => {
            setError(null)
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  shopSlug,
                  amount,
                  requireShipping: orderData.fulfillment_type === 'delivery',
                }),
              })

              const data = await res.json()

              if (!res.ok) {
                throw new Error(data.error || 'Failed to create PayPal order')
              }

              return data.id
            } catch (err: any) {
              const message = err.message || 'PayPal order creation failed'
              setError(message)
              onError(message)
              throw err
            }
          }}
          onApprove={async (data) => {
            onSuccess(data.orderID, '')
          }}
          onError={(err) => {
            console.error('PayPal Buttons error:', err)
            const message = 'An error occurred with PayPal. Please try again.'
            setError(message)
            onError(message)
          }}
          onCancel={() => {
            setError('Payment was cancelled. You can try again.')
          }}
        />
      </PayPalScriptProvider>
    </div>
  )
}
