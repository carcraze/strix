import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_BASE    = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
const REDIRECT_URI = `${APP_BASE}/api/integrations/callback/gitlab`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code     = searchParams.get('code');
    const rawState = searchParams.get('state');

    if (!code || !rawState) {
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=missing_params`);
    }

    let orgId: string;
    try {
        const parsed = JSON.parse(Buffer.from(rawState, 'base64').toString());
        orgId = parsed.orgId;
    } catch {
        orgId = rawState;
    }

    if (!orgId) {
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=no_org`);
    }

    try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://gitlab.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id:     process.env.GITLAB_CLIENT_ID,
                client_secret: process.env.GITLAB_CLIENT_SECRET,
                code,
                grant_type:    'authorization_code',
                redirect_uri:  REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const accessToken   = tokenData.access_token;
        const refreshToken  = tokenData.refresh_token;
        const expiresIn: number = tokenData.expires_in || 7200;
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // 2. Get GitLab user info
        const userRes = await fetch('https://gitlab.com/api/v4/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const glUser = await userRes.json();

        // 3. Store token (vault trigger encrypts + nulls access_token automatically)
        await supabaseAdmin.from('integrations').upsert({
            organization_id:  orgId,
            provider:         'gitlab',
            access_token:     accessToken,
            refresh_token:    refreshToken,
            token_expires_at: tokenExpiresAt,
            provider_user_id: String(glUser.id || ''),
            provider_username: glUser.username || '',
            status:           'connected',
            installed_at:     new Date().toISOString(),
            updated_at:       new Date().toISOString(),
        }, { onConflict: 'organization_id,provider' });

        // 4. Sync repos from GitLab API
        let page = 1;
        let synced = 0;
        while (true) {
            const repoRes = await fetch(
                `https://gitlab.com/api/v4/projects?membership=true&per_page=100&page=${page}&order_by=last_activity_at`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!repoRes.ok) break;
            const projects: any[] = await repoRes.json();
            if (!projects.length) break;

            const rows = projects.map((p: any) => ({
                organization_id:  orgId,
                provider:         'gitlab',
                provider_repo_id: String(p.id),
                full_name:        p.path_with_namespace,
                default_branch:   p.default_branch || 'main',
                auto_review_enabled: false,
            }));

            await supabaseAdmin.from('repositories').upsert(rows, {
                onConflict: 'organization_id,provider,provider_repo_id',
                ignoreDuplicates: false,
            });

            synced += projects.length;
            if (projects.length < 100) break;
            page++;
            if (page > 5) break;
        }

        console.log(`[GitLab CB] Connected for org ${orgId} — synced ${synced} repos`);
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?connected=gitlab&repos=${synced}`);

    } catch (err: any) {
        console.error('[GitLab CB] Error:', err.message);
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=gitlab_failed`);
    }
}
