import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_BASE    = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
const REDIRECT_URI = `${APP_BASE}/api/integrations/callback/github`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code     = searchParams.get('code');
    const rawState = searchParams.get('state');

    if (!code || !rawState) {
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=missing_params`);
    }

    // Decode org_id from state (base64-encoded JSON set by authorize/route.ts)
    let orgId: string;
    try {
        const parsed = JSON.parse(Buffer.from(rawState, 'base64').toString());
        orgId = parsed.orgId;
    } catch {
        orgId = rawState; // fallback: state is plain UUID
    }

    if (!orgId) {
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=no_org`);
    }

    try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id:     process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri:  REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
        const accessToken: string = tokenData.access_token;

        // 2. Get GitHub user info
        const ghUserRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Zentinel-App' },
        });
        const ghUser = await ghUserRes.json();

        // 3. Store token in integrations table (vault trigger encrypts it automatically)
        await supabaseAdmin.from('integrations').upsert({
            organization_id: orgId,
            provider:         'github',
            access_token:     accessToken,   // vault trigger encrypts + nulls this
            provider_user_id: String(ghUser.id || ''),
            provider_username: ghUser.login || '',
            scope:            tokenData.scope || '',
            status:           'connected',
            installed_at:     new Date().toISOString(),
            metadata: {
                avatar_url: ghUser.avatar_url,
                html_url:   ghUser.html_url,
                name:       ghUser.name,
            },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,provider' });

        // 4. Sync repos from GitHub API into repositories table
        //    Fetch all repos the user has access to (respects the OAuth scope)
        let page = 1;
        let synced = 0;
        while (true) {
            const repoRes = await fetch(
                `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
                { headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Zentinel-App' } }
            );
            if (!repoRes.ok) break;
            const repos: any[] = await repoRes.json();
            if (!repos.length) break;

            const rows = repos.map((r: any) => ({
                organization_id:  orgId,
                provider:         'github',
                provider_repo_id: String(r.id),
                full_name:        r.full_name,
                default_branch:   r.default_branch || 'main',
                auto_review_enabled: false,
            }));

            await supabaseAdmin.from('repositories').upsert(rows, {
                onConflict: 'organization_id,provider,provider_repo_id',
                ignoreDuplicates: false,
            });

            synced += repos.length;
            if (repos.length < 100) break;
            page++;
            if (page > 5) break; // hard cap: 500 repos max per sync
        }

        console.log(`[GitHub CB] Connected for org ${orgId} — synced ${synced} repos`);

        // 5. Redirect back to integrations page with success state
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?connected=github&repos=${synced}`);

    } catch (err: any) {
        console.error('[GitHub CB] Error:', err.message);
        return NextResponse.redirect(`${APP_BASE}/dashboard/integrations?error=github_failed`);
    }
}
