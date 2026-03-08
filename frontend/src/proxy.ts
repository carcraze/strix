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

    // --- SUBDOMAIN ROUTING ---
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''
    const isAppSubdomain = hostname.startsWith('app.zentinel.dev')
    const isCrmSubdomain = hostname.startsWith('crm.zentinel.dev')

    // 1. Handle app.zentinel.dev
    if (isAppSubdomain) {
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', request.url))
        }
        if (url.pathname.startsWith('/crm')) {
            return NextResponse.redirect(new URL('https://crm.zentinel.dev', request.url))
        }
    }

    // 2. Handle crm.zentinel.dev
    if (isCrmSubdomain) {
        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/crm', request.url))
        }
        if (url.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('https://app.zentinel.dev', request.url))
        }
    }

    // 3. Fallback for main domain (zentinel.dev)
    if (!isAppSubdomain && !isCrmSubdomain) {
        if (url.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL(`https://app.zentinel.dev${url.pathname}`, request.url))
        }
        if (url.pathname.startsWith('/crm')) {
            return NextResponse.redirect(new URL(`https://crm.zentinel.dev${url.pathname}`, request.url))
        }
    }
    // --- END SUBDOMAIN ROUTING ---

    const pathname = request.nextUrl.pathname
    const isCrmPath = pathname.startsWith('/crm')
    const isCrmSignIn = pathname === '/crm/sign-in'
    const isCrm2FA = pathname.startsWith('/crm/setup-2fa') || pathname.startsWith('/crm/verify-2fa')

    // Protect /crm routes
    if (isCrmPath) {
        // 1. If user is logged in and on sign-in page, redirect to main CRM
        if (user && isCrmSignIn) {
            return NextResponse.redirect(new URL('/crm', request.url))
        }

        // 2. If not logged in and not on sign-in page, redirect to sign-in
        if (!user && !isCrmSignIn && !isCrm2FA) {
            return NextResponse.redirect(new URL('/crm/sign-in', request.url))
        }

        // 3. If logged in and on protected crm route (not sign-in/2fa pages themselves)
        if (user && !isCrmSignIn && !isCrm2FA) {
            // Check MFA / AAL status
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

            if (mfaData) {
                if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
                    // Factors exist but not verified
                    return NextResponse.redirect(new URL('/crm/verify-2fa', request.url))
                } else if (mfaData.currentLevel === 'aal1' && mfaData.nextLevel === 'aal1') {
                    // No factors enrolled, force setup
                    return NextResponse.redirect(new URL('/crm/setup-2fa', request.url))
                }
            }

            // 4. Staff Check (Only for fully verified users)
            try {
                const adminClient = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )

                const { data: staff, error } = await adminClient
                    .from('crm_staff')
                    .select('is_active')
                    .eq('user_id', user.id)
                    .single()

                if (error || !staff || !staff.is_active) {
                    console.error('CRM staff access denied for:', user.email)
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
            } catch (err) {
                console.error('CRM proxy error:', err)
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/crm/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
