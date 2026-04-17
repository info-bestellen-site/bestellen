import { NextRequest, NextResponse } from 'next/server'
import { getPayPalOrder } from '@/lib/paypal/client'

/**
 * GET /api/paypal/get-order-details?orderId=...
 * 
 * Fetches the PayPal order details for verification before capture.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const order = await getPayPalOrder(orderId)

    // Extract relevant shipping and customer info
    const payer = order.payer
    const shipping = order.purchase_units?.[0]?.shipping
    
    let formattedAddress = ''
    if (shipping?.address) {
      const addr = shipping.address
      const parts = [
        addr.address_line_1,
        addr.address_line_2,
        `${addr.postal_code} ${addr.admin_area_2 || addr.admin_area_1}`
      ].filter(Boolean)
      formattedAddress = parts.join(', ')
    }

    const customerName = payer?.name ? `${payer.name.given_name} ${payer.name.surname}` : ''

    return NextResponse.json({
      orderId,
      customerName,
      address: formattedAddress,
      rawAddress: shipping?.address,
      payerInfo: payer
    })

  } catch (error: any) {
    console.error('PayPal get-order-details error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}
