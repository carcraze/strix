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

    if (!code || !orgId) {
        return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=missing_callback_params`);
    }

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error_description || data.error);

        // Save token to Supabase
        const { error } = await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: orgId,
                provider: 'github',
                access_token: data.access_token,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organization_id,provider' });

        if (error) throw error;

        return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=github`);
    } catch (error) {
        console.error('GitHub connection error:', error);
        return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=github_connection_failed`);
    }
}
