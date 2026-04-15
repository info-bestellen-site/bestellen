import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getMerchantOnboardingStatus } from '@/lib/paypal/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const merchantIdFromParam = searchParams.get('merchantIdInPayPal') || searchParams.get('merchantId')
  const shopId = searchParams.get('shopId')
  
  console.log('PayPal Onboarding Callback received:', { 
    shopId, 
    merchantIdInPayPal: merchantIdFromParam,
    status: searchParams.get('status'),
    permissionsGranted: searchParams.get('permissionsGranted')
  })

  try {
    if (!shopId) {
      console.error('PayPal onboarding callback: Missing shopId in URL')
      return new NextResponse('Missing shopId', { status: 400 })
    }

    let finalMerchantId = merchantIdFromParam

    // MANDATORY FALLBACK: If merchantId is not in the URL, we MUST query the PayPal API.
    // This is the standard procedure for the Partner/Platform model.
    if (!finalMerchantId) {
      console.log(`[PayPal] Merchant ID is null in URL params. Triggering API fallback for shopId: ${shopId}`)
      const status = await getMerchantOnboardingStatus(shopId)
      
      if (status.onboardingCompleted && status.merchantId) {
        console.log(`[PayPal] API Fallback SUCCESS. Found Merchant ID: ${status.merchantId}`)
        finalMerchantId = status.merchantId
      } else {
        console.warn(`[PayPal] API Fallback did not find a completed integration for: ${shopId}`)
      }
    }

    // Still no ID? We cannot proceed.
    if (!finalMerchantId) {
      console.error('[PayPal] Onboarding FAILED: No merchant ID found in URL or via API.')
      
      const host = req.headers.get('host')
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <h1 style="color: #d32f2f;">PayPal Verbindung fehlgeschlagen</h1>
            <p>Wir konnten keine verknüpfte Händler-ID von PayPal abrufen.</p>
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem;">
              Shop ID: ${shopId}<br>
              Status: ${searchParams.get('status') || 'N/A'}<br>
              Check das Terminal für Details (401 Fehler? BN Code prüfen!)
            </div>
            <p style="margin-top: 2rem;">
              <a href="http://${host}/masthan/admin/settings" style="background: #0070ba; color: white; padding: 0.8rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Zurück zu den Einstellungen
              </a>
            </p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // UPDATE DATABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key') {
      console.error('CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is not configured!')
      return new NextResponse('Configuration Error: Missing DB Access Key', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[PayPal] Updating shop ${shopId} with Merchant ID: ${finalMerchantId}`)
    
    const { error: updateError, data: shopData } = await supabase
      .from('shops')
      .update({
        paypal_merchant_id: finalMerchantId,
        paypal_enabled: true,
      })
      .eq('id', shopId)
      .select('slug')
      .single()

    if (updateError) {
      console.error('[PayPal] Supabase update error:', updateError)
      return new NextResponse('Database update failed', { status: 500 })
    }

    console.log(`[PayPal] Success! PayPal is now active for: ${shopData.slug}`)

    // REDIRECT BACK TO ADMIN WITH SUCCESS
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    
    return NextResponse.redirect(`${protocol}://${host}/${shopData.slug}/admin/settings?paypal_connected=true`)
    
  } catch (error: any) {
    console.error('PayPal onboarding-callback unexpected error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
