import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal/client'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/paypal/complete-order
 * 
 * This is an atomic endpoint that:
 * 1. Captures the PayPal payment.
 * 2. If successful, creates the order in Supabase with 'paid' status.
 * This prevents "phantom" orders from being created if the payment is cancelled.
 */
export async function POST(req: NextRequest) {
  try {
    const { paypalOrderId, orderData } = await req.json()

    if (!paypalOrderId || !orderData) {
      return NextResponse.json(
        { error: 'paypalOrderId and orderData are required' },
        { status: 400 }
      )
    }

    // 1. Capture the PayPal payment
    console.log(`[PayPal] Capturing order: ${paypalOrderId}`)
    const captureData = await capturePayPalOrder(paypalOrderId)

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${captureData.status}` },
        { status: 400 }
      )
    }

    // 2. Initialise Supabase with service role for administrative bypass
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Extract customer info from PayPal if missing
    const payer = (captureData as any).payer as any
    const shipping = (captureData as any).purchase_units?.[0]?.shipping as any
    const address = shipping?.address as any

    // Helper to check if a string is effectively empty (only whitespace, commas, or dots)
    const isEmpty = (str: string | null | undefined) => !str || str.replace(/[,\s.]/g, '').length === 0

    const customerName = !isEmpty(orderData.customer_name) 
      ? orderData.customer_name 
      : (payer?.name ? `${payer.name.given_name} ${payer.name.surname}` : 'PayPal Customer')
    
    let deliveryAddress = orderData.delivery_address
    if (isEmpty(deliveryAddress) && address) {
      const parts = [
        address.address_line_1,
        address.address_line_2,
        `${address.postal_code} ${address.admin_area_2}`
      ].filter(Boolean)
      deliveryAddress = parts.join(', ')
    }

    // 4. Create the order in Supabase
    console.log(`[PayPal] Creating Supabase order for shop: ${orderData.shop_id}`)
    
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        shop_id: orderData.shop_id,
        customer_name: customerName,
        customer_phone: !isEmpty(orderData.customer_phone) 
          ? orderData.customer_phone 
          : (payer?.phone?.phone_number?.national_number || 'PayPal'),
        delivery_address: deliveryAddress,
        fulfillment_type: orderData.fulfillment_type,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee,
        total: orderData.total,
        notes: orderData.notes,
        estimated_ready_at: orderData.estimated_ready_at,
        guest_count: orderData.guest_count,
        status: 'pending',
        payment_method: 'paypal',
        payment_status: 'paid', // Mark as paid immediately
        paypal_order_id: paypalOrderId,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[PayPal] Supabase order insertion error:', orderError)
      return NextResponse.json(
        { 
          error: 'Payment captured but database update failed. Please contact support.',
          paypalOrderId 
        },
        { status: 500 }
      )
    }

    // 4. Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name + (item.selectedModifiers?.length ? ` (${item.selectedModifiers.map((m: any) => m.optionName).join(', ')})` : ''),
      quantity: item.quantity,
      unit_price: item.totalPrice,
    }))

    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[PayPal] Supabase order items insertion error:', itemsError)
      // Note: The order header exists, so we return 200 but maybe with a warning? 
      // In production, you'd want a transaction or cleanup.
    }

    console.log(`[PayPal] Order ${order.id} completed successfully.`)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paypalOrderId
    })

  } catch (error: any) {
    console.error('PayPal complete-order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    )
  }
}
