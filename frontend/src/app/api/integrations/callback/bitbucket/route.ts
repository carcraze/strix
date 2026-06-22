import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDIRECT_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
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

        // 2. Get Bitbucket user info
        const userRes = await fetch('https://api.bitbucket.org/2.0/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const bbUser = await userRes.json();

        // 3. Save token to integrations table
        const { error: integrationError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: orgId,
                provider: 'bitbucket',
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: tokenExpiresAt,
                provider_user_id: String(bbUser.uuid || ''),
                provider_username: bbUser.username || bbUser.display_name || '',
                status: 'connected',
                installed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organization_id,provider' });

        if (integrationError) throw integrationError;

        // 4. Sync repos from Bitbucket API
        let page = 1;
        let synced = 0;
        let nextUrl: string | null = `https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100`;
        while (nextUrl) {
            const repoRes = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!repoRes.ok) break;
            const data: any = await repoRes.json();
            const repos: any[] = data.values || [];
            if (!repos.length) break;

            const rows = repos.map((r: any) => ({
                organization_id: orgId,
                provider: 'bitbucket',
                provider_repo_id: String(r.uuid || r.full_name),
                full_name: r.full_name,
                default_branch: r.mainbranch?.name || 'main',
                auto_review_enabled: false,
            }));

            await supabaseAdmin.from('repositories').upsert(rows, {
                onConflict: 'organization_id,provider,provider_repo_id',
                ignoreDuplicates: false,
            });

            synced += repos.length;
            nextUrl = data.next || null;
            page++;
            if (page > 5) break; // cap at 500 repos
        }

        console.log(`[Bitbucket CB] Connected for org ${orgId} — synced ${synced} repos`);

        // 5. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?connected=bitbucket&repos=${synced}`);
    } catch (err) {
        console.error('Bitbucket OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=bitbucket_connection_failed`);
    }
}
