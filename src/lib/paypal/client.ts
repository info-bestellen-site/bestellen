/**
 * PayPal REST API helper for server-side operations.
 * Uses the PayPal Orders v2 API with Partner/Platform model.
 */

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal OAuth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

/**
 * Creates a PayPal order targeting a specific shop's merchant account.
 */
export async function createPayPalOrder(params: {
  amount: number
  currency?: string
  merchantId: string
  shopName: string
  orderDescription?: string
}): Promise<{ id: string; status: string }> {
  const { amount, currency = 'EUR', merchantId, shopName, orderDescription } = params
  const accessToken = await getAccessToken()

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: orderDescription || `Bestellung bei ${shopName}`,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        payee: {
          merchant_id: merchantId,
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: shopName,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      },
    },
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create order failed: ${res.status} ${text}`)
  }

  return res.json()
}

/**
 * Captures a previously approved PayPal order.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  id: string
  status: string
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string
        status: string
        amount: { value: string; currency_code: string }
      }>
    }
  }>
}> {
  const accessToken = await getAccessToken()

  const bnCode = process.env.PAYPAL_BN_CODE

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(bnCode ? { 'PayPal-Partner-Attribution-Id': bnCode } : {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal capture failed: ${res.status} ${text}`)
  }

  return res.json()
}

/**
 * Generates a PayPal Partner Referral URL to onboard a merchant.
 */
export async function generatePartnerReferralUrl(trackingId: string, returnUrl: string) {
  const accessToken = await getAccessToken()

  const body = {
    tracking_id: trackingId,
    partner_config_override: {
      return_url: returnUrl,
    },
    operations: [
      {
        operation: 'API_INTEGRATION',
        api_integration_preference: {
          rest_api_integration: {
            integration_method: 'PAYPAL',
            integration_type: 'THIRD_PARTY',
            third_party_details: {
              features: ['PAYMENT', 'REFUND'],
            },
          },
        },
      },
    ],
    products: ['EXPRESS_CHECKOUT'],
    legal_consents: [
      {
        type: 'SHARE_DATA_CONSENT',
        granted: true,
      },
    ],
  }

  const bnCode = process.env.PAYPAL_BN_CODE

  const res = await fetch(`${PAYPAL_API_BASE}/v2/customer/partner-referrals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(bnCode ? { 'PayPal-Partner-Attribution-Id': bnCode } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal partner referral failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  // The response contains an array of links. We need the one with rel='action_url'
  const actionLink = data.links.find((l: any) => l.rel === 'action_url')
  
  if (!actionLink) {
    throw new Error('PayPal did not return an action_url for onboarding')
  }

  return actionLink.href
}
export async function getMerchantOnboardingStatus(trackingId: string): Promise<{
  merchantId: string | null
  onboardingCompleted: boolean
}> {
  try {
    const accessToken = await getAccessToken()
    const partnerId = process.env.PAYPAL_PARTNER_ID
    const bnCode = process.env.PAYPAL_BN_CODE

    if (!partnerId || partnerId === 'your_paypal_merchant_id') {
      console.warn('[PayPal] PAYPAL_PARTNER_ID is not configured. Fallback status check skipped.')
      return { merchantId: null, onboardingCompleted: false }
    }

    console.log(`[PayPal] Querying status for tracking_id: ${trackingId} using BN Code: ${bnCode || 'NONE'}`)

    const res = await fetch(
      `${PAYPAL_API_BASE}/v1/customer/partners/${partnerId}/merchant-integrations?tracking_id=${trackingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(bnCode ? { 'PayPal-Partner-Attribution-Id': bnCode } : {}),
        },
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error(`PayPal API Error (${res.status}): ${text}`)
      return { merchantId: null, onboardingCompleted: false }
    }

    const data = await res.json()
    console.log('PayPal API Response for onboarding status:', JSON.stringify(data, null, 2))
    
    // The Merchant ID is top-level. Status is in integration_details.
    const merchantId = data.merchant_id || null
    const onboardingCompleted = !!merchantId && data.integration_details?.[0]?.onboarding_complete !== false
    
    return { merchantId, onboardingCompleted }
  } catch (err: any) {
    console.error('getMerchantOnboardingStatus unexpected exception:', err)
    return { merchantId: null, onboardingCompleted: false }
  }
}
