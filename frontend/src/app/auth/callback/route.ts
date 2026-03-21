import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // IMPORTANT: If they are recovering a password, force them to the reset page
                if (next === '/reset-password') {
                    return NextResponse.redirect(`${origin}/reset-password`)
                }

                const adminClient = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )

                // 1. Check if CRM staff
                const { data: crmStaff } = await adminClient
                    .from('crm_staff')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .maybeSingle()

                if (crmStaff) {
                    return NextResponse.redirect('https://crm.zentinel.dev')
                }

                // 2. Check if has organization
                const { data: orgMember } = await adminClient
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle()

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';

                if (orgMember) {
                    // Respect "next" param if it points to app or dashboard
                    if (next.startsWith('/dashboard') || next.startsWith('/settings')) {
                        return NextResponse.redirect(`${baseUrl}${next}`)
                    }
                    return NextResponse.redirect(`${baseUrl}/dashboard`)
                }

                // 3. Fallback to onboarding/signup
                return NextResponse.redirect(`${baseUrl.replace('app.', '')}/sign-up`)
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`)
}
