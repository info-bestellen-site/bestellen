import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal/client'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/paypal/capture-order
 * Body: { paypalOrderId: string, supabaseOrderId: string }
 *
 * Captures an approved PayPal payment and updates the Supabase order.
 */
export async function POST(req: NextRequest) {
  try {
    const { paypalOrderId, supabaseOrderId } = await req.json()

    if (!paypalOrderId || !supabaseOrderId) {
      return NextResponse.json(
        { error: 'paypalOrderId and supabaseOrderId required' },
        { status: 400 }
      )
    }

    // 1. Capture the PayPal payment
    const captureData = await capturePayPalOrder(paypalOrderId)

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${captureData.status}` },
        { status: 400 }
      )
    }

    // 2. Update order in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      var supabase = createClient(supabaseUrl, supabaseAnonKey)
    } else {
      var supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    const { error: updateError } = await (supabase
      .from('orders') as any)
      .update({
        payment_status: 'paid',
        paypal_order_id: paypalOrderId,
      })
      .eq('id', supabaseOrderId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      // Payment was captured but DB update failed — log for manual resolution
      return NextResponse.json(
        { 
          error: 'Payment captured but database update failed. Please contact support.',
          paypalOrderId,
          captureStatus: captureData.status,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paypalOrderId,
      captureStatus: captureData.status,
    })
  } catch (error: any) {
    console.error('PayPal capture-order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal payment' },
      { status: 500 }
    )
  }
}
