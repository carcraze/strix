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
        const basicAuth = Buffer.from(`${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`).toString('base64');

        const response = await fetch('https://bitbucket.org/site/oauth2/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
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
                provider: 'bitbucket',
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organization_id,provider' });

        if (error) throw error;

        return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=bitbucket`);
    } catch (error) {
        console.error('Bitbucket connection error:', error);
        return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=bitbucket_connection_failed`);
    }
}
