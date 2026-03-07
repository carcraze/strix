import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const orgId = searchParams.get('state');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/integrations/callback/gitlab`;

    if (!code || !orgId) {
        return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=missing_callback_params`);
    }

    try {
        const response = await fetch('https://gitlab.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITLAB_CLIENT_ID,
                client_secret: process.env.GITLAB_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            }),
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error_description || data.error);

        // Save token to Supabase
        const { error } = await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: orgId,
                provider: 'gitlab',
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organization_id,provider' });

        if (error) throw error;

        return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=gitlab`);
    } catch (error) {
        console.error('GitLab connection error:', error);
        return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=gitlab_connection_failed`);
    }
}
