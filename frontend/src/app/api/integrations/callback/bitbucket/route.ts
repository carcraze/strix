import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDIRECT_BASE = 'https://app.zentinel.dev';
const WEBHOOK_URL = `${REDIRECT_BASE}/api/webhooks/bitbucket`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const rawState = searchParams.get('state');

    if (!code || !rawState) {
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=missing_callback_params`);
    }

    let orgId: string;
    try {
        const parsed = JSON.parse(Buffer.from(rawState, 'base64').toString());
        orgId = parsed.orgId;
    } catch {
        orgId = rawState;
    }

    if (!orgId) {
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=missing_org_id`);
    }

    try {
        // 1. Exchange code for access token using HTTP Basic auth
        const basicAuth = Buffer.from(
            `${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`
        ).toString('base64');

        const tokenRes = await fetch('https://bitbucket.org/site/oauth2/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${REDIRECT_BASE}/api/integrations/callback/bitbucket`,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const expiresIn: number = tokenData.expires_in;
        const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        // 2. Save token to integrations table
        const { error: integrationError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: orgId,
                provider: 'bitbucket',
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: tokenExpiresAt,
                status: 'connected',
                installed_at: new Date().toISOString(),
            }, { onConflict: 'organization_id,provider' });

        if (integrationError) throw integrationError;

        // 3. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/repositories?connected=bitbucket`);
    } catch (err) {
        console.error('Bitbucket OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=bitbucket_connection_failed`);
    }
}
