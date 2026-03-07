import { NextResponse } from 'next/server';
import { WorkOS } from '@workos-inc/node';
import { createClient } from '@supabase/supabase-js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        const { profile } = await workos.sso.getProfileAndToken({
            code,
            clientId: process.env.WORKOS_CLIENT_ID || '',
        });

        const email = profile.email;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Find user in Supabase
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

        // Find user by email and handle type differences between list and create result
        const existingUser = users.find(u => u.email === email);
        let targetUser = existingUser || null;

        if (!targetUser) {
            // Create user if they don't exist
            const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    full_name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User',
                    sso_provider: 'workos',
                    sso_id: profile.id,
                }
            });
            if (createError) throw createError;
            targetUser = newUser;
        }

        // Generate magic link to securely sign the user in
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
                redirectTo: `${siteUrl}/dashboard`
            }
        });

        if (linkError) throw linkError;
        if (!data?.properties?.action_link) throw new Error('Failed to generate sign-in link');

        // Redirect to the sign-in link
        return NextResponse.redirect(data.properties.action_link);

    } catch (e) {
        console.error('SSO Callback error:', e);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${siteUrl}/sign-in?error=sso_failed`);
    }
}
