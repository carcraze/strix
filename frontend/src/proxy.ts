import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // --- SUBDOMAIN ROUTING & SMART REDIRECTS ---
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''
    const isAppSubdomain = hostname.startsWith('app.zentinel.dev')
    const isCrmSubdomain = hostname.startsWith('crm.zentinel.dev')
    const isMainDomain = !isAppSubdomain && !isCrmSubdomain

    // 1. Smart Post-Login Routing for Main Domain (signed-in user visits / or /sign-in)
    if (user && isMainDomain && (url.pathname === '/' || url.pathname === '/sign-in')) {
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if CRM Staff (use maybeSingle to avoid throwing)
        const { data: staff } = await adminClient
            .from('crm_staff')
            .select('is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

        if (staff) {
            return NextResponse.redirect(new URL('https://crm.zentinel.dev', request.url))
        }

        // Check if has Organization
        const { data: orgMember } = await adminClient
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (orgMember) {
            return NextResponse.redirect(new URL('https://app.zentinel.dev/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('https://zentinel.dev/sign-up', request.url))
        }
    }

    // 2. Handle app.zentinel.dev
    if (isAppSubdomain) {
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', request.url))
        }
        if (url.pathname.startsWith('/crm')) {
            return NextResponse.redirect(new URL('https://crm.zentinel.dev', request.url))
        }
    }

    // 3. Handle crm.zentinel.dev — rewrite ONLY root / and /dashboard to /crm
    //    IMPORTANT: do NOT rewrite /crm to /crm (that causes an infinite loop!)
    if (isCrmSubdomain) {
        // Only rewrite bare root to /crm – do NOT match /crm paths (they are already correct)
        if (url.pathname === '/' || url.pathname === '/dashboard') {
            return NextResponse.rewrite(new URL('/crm', request.url))
        }
        // If someone types /dashboard/anything on CRM subdomain, show CRM dashboard
        if (url.pathname.startsWith('/dashboard')) {
            return NextResponse.rewrite(new URL('/crm', request.url))
        }
        // /crm/* paths already map directly — no rewrite needed, just fall through
    }

    // 4. Fallback for main domain (zentinel.dev) paths
    if (isMainDomain) {
        if (url.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL(`https://app.zentinel.dev${url.pathname}`, request.url))
        }
        if (url.pathname.startsWith('/crm')) {
            return NextResponse.redirect(new URL(`https://crm.zentinel.dev${url.pathname}`, request.url))
        }
    }
    // --- END SUBDOMAIN ROUTING & SMART REDIRECTS ---

    const pathname = request.nextUrl.pathname
    const isCrmPath = pathname.startsWith('/crm')
    const isCrmSignIn = pathname === '/crm/sign-in'
    const isCrm2FA = pathname.startsWith('/crm/setup-2fa') || pathname.startsWith('/crm/verify-2fa')

    // Protect /crm routes — middleware only handles auth & 2FA
    // Staff authorization is handled by layout.tsx (shows Claim Identity / Suspended screens)
    // IMPORTANT: no staff DB check here — that caused a redirect loop:
    //   staff-fails → /crm/sign-in → user logged in → /crm → staff-fails → ∞
    if (isCrmPath) {
        // Let sign-in and 2FA pages through without auth check
        if (isCrmSignIn || isCrm2FA) {
            // If user is already logged in and lands on sign-in, send them to /crm
            if (user && isCrmSignIn) {
                return NextResponse.redirect(new URL('/crm', request.url))
            }
            // Otherwise render the page as-is (sign-in form, 2FA setup/verify)
            return response
        }

        // Not on sign-in/2FA page: must be authenticated
        if (!user) {
            return NextResponse.redirect(new URL('/crm/sign-in', request.url))
        }

        // Logged in — enforce 2FA (MFA level check)
        const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (mfaData) {
            if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
                // Has a 2FA factor enrolled but hasn't verified this session
                return NextResponse.redirect(new URL('/crm/verify-2fa', request.url))
            } else if (mfaData.currentLevel === 'aal1' && mfaData.nextLevel === 'aal1') {
                // No 2FA factor enrolled at all — force setup
                return NextResponse.redirect(new URL('/crm/setup-2fa', request.url))
            }
        }

        // All good — let the layout handle staff check and render the page
    }

    return response
}

export const config = {
    matcher: [
        '/crm/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
