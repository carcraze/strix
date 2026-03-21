import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDIRECT_BASE = 'https://app.zentinel.dev';
const REDIRECT_URI = `${REDIRECT_BASE}/api/integrations/callback/gitlab`;
const WEBHOOK_URL = `${REDIRECT_BASE}/api/webhooks/gitlab`;

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
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://gitlab.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITLAB_CLIENT_ID,
                client_secret: process.env.GITLAB_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
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
                provider: 'gitlab',
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: tokenExpiresAt,
                status: 'connected',
                installed_at: new Date().toISOString(),
            }, { onConflict: 'organization_id,provider' });

        if (integrationError) throw integrationError;

        // 3. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/repositories?connected=gitlab`);
    } catch (err) {
        console.error('GitLab OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=gitlab_connection_failed`);
    }
}
