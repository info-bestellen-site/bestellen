import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal/client'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/paypal/create-order
 * Body: { shopSlug: string, amount: number, currency?: string, requireShipping?: boolean }
 *
 * Creates a PayPal order targeting the shop's merchant account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopSlug, amount, currency, requireShipping } = body

    if (!shopSlug || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request: shopSlug and positive amount required' },
        { status: 400 }
      )
    }

    // Use service-role to read shop data server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      // Fall back to anon key for now if service key not set
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      var supabase = createClient(supabaseUrl, supabaseAnonKey)
    } else {
      var supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    const { data: shop, error: shopError } = await (supabase as any)
      .from('shops')
      .select('id, name, paypal_enabled, paypal_merchant_id')
      .eq('slug', shopSlug)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (!shop.paypal_enabled || !shop.paypal_merchant_id) {
      return NextResponse.json(
        { error: 'PayPal is not enabled for this shop' },
        { status: 400 }
      )
    }

    const order = await createPayPalOrder({
      amount,
      currency: currency || 'EUR',
      merchantId: shop.paypal_merchant_id,
      shopName: shop.name,
      shippingPreference: requireShipping ? 'GET_FROM_FILE' : 'NO_SHIPPING',
    })

    return NextResponse.json({ id: order.id, status: order.status })
  } catch (error: any) {
    console.error('PayPal create-order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
