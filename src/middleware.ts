import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import domains from './config/domains.json'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const { pathname } = url

  // Skip rewriting for internal Next.js paths and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // Protect admin routes
  const isAdminRoute = pathname.includes('/admin')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  if (isAdminRoute && !user) {
    // Protect admin routes — redirect to /auth/login if not logged in
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  } else if (isOnboardingRoute && !user) {
    // Protect onboarding — redirect to /auth/login if not logged in
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  // --- DOMAIN & SUBDOMAIN MAPPING ---
  
  // 1. Check for explicit mapping in domains.json (Prioritized)
  let shopSlug = (domains as Record<string, string>)[host]

  // 2. Fallback to automatic subdomain extraction
  if (!shopSlug) {
    const isLocal = host.includes('localhost')
    const hostParts = host.split('.')

    if (isLocal) {
      // sakura-sushi.localhost:3001 -> parts: ["sakura-sushi", "localhost:3001"]
      if (hostParts.length > 1 && hostParts[0] !== 'localhost') {
        shopSlug = hostParts[0]
      }
    } else {
      // sakura-sushi.bestellen.site -> parts: ["sakura-sushi", "bestellen", "site"]
      if (hostParts.length > 2 && hostParts[0] !== 'www') {
        shopSlug = hostParts[0]
      }
    }
  }

  // If a shop slug is found, rewrite the request internally to /[shop-slug]
  if (shopSlug) {
    // Check if the path already starts with the shop slug to avoid loops
    if (!pathname.startsWith(`/${shopSlug}`)) {
      const newUrl = new URL(`/${shopSlug}${pathname}`, request.url)
      
      const rewriteResponse = NextResponse.rewrite(newUrl)
      
      // Copy cookies from supabaseResponse to the new rewriteResponse
      supabaseResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value)
      })
      
      return rewriteResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
