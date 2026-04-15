import { NextRequest, NextResponse } from 'next/server'
import { generatePartnerReferralUrl } from '@/lib/paypal/client'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/paypal/partner-referral?shopId=xxx
 * 
 * Generates the PayPal onboarding link for a specific shop.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get('shopId')

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // In a real app, verify the user has access to this shop
    // For now, we assume the caller is authorized (Admin context)

    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const returnUrl = `${protocol}://${host}/api/paypal/onboarding-callback?shopId=${shopId}`

    console.log(`[PayPal] Generating referral URL for shop: ${shopId}`)
    console.log(`[PayPal] BN Code used: ${process.env.PAYPAL_BN_CODE || 'NONE'}`)
    console.log(`[PayPal] Return URL: ${returnUrl}`)

    const onboardingUrl = await generatePartnerReferralUrl(shopId, returnUrl)

    console.log(`[PayPal] Successfully generated onboarding URL: ${onboardingUrl}`)

    return NextResponse.json({ onboardingUrl })
  } catch (error: any) {
    console.error('PayPal partner-referral error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate onboarding link' },
      { status: 500 }
    )
  }
}
