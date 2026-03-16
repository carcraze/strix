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

        // 3. Get all workspaces the user belongs to
        const wsRes = await fetch('https://api.bitbucket.org/2.0/workspaces?pagelen=100', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const wsData = await wsRes.json();
        const workspaces: string[] = (wsData?.values || []).map((w: any) => w.slug);

        // Fallback: use the user's own username if no workspaces returned
        if (workspaces.length === 0) {
            const userRes = await fetch('https://api.bitbucket.org/2.0/user', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const user = await userRes.json();
            const slug = user?.username || user?.account_id;
            if (slug) workspaces.push(slug);
        }

        // 4. Fetch ALL repos from every workspace with pagination
        const allRepos: any[] = [];
        for (const ws of workspaces) {
            let nextUrl: string | null = `https://api.bitbucket.org/2.0/repositories/${ws}?pagelen=100&sort=-updated_on`;
            while (nextUrl) {
                const res: Response = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                const page: { values?: any[]; next?: string } = await res.json();
                const batch: any[] = page?.values || [];
                allRepos.push(...batch.map(repo => ({ ...repo, _workspace: ws })));
                nextUrl = page?.next || null;
            }
        }

        // 5. Save repos to repositories table
        const allRepoRows = allRepos.map(repo => ({
            organization_id: orgId,
            full_name: repo.full_name,
            provider: 'bitbucket',
            provider_repo_id: repo.uuid,
            default_branch: repo.mainbranch?.name || 'main',
            auto_review_enabled: false,
        }));

        if (allRepoRows.length > 0) {
            await supabaseAdmin
                .from('repositories')
                .upsert(allRepoRows, { onConflict: 'organization_id,provider_repo_id', ignoreDuplicates: true });
        }

        // 6. Auto-register Zentinel webhook on each Bitbucket repo (best effort)
        const webhookSecret = process.env.BITBUCKET_WEBHOOK_SECRET;
        if (webhookSecret) {
            const webhookIds: Record<string, string> = {};
            for (const repo of allRepos) {
                const ws = repo._workspace;
                const slug = repo.slug;
                try {
                    const hookRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${ws}/${slug}/hooks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            description: 'Zentinel PR Security Review',
                            url: WEBHOOK_URL,
                            active: true,
                            secret: webhookSecret,
                            events: ['pullrequest:created', 'pullrequest:updated'],
                        }),
                    });
                    if (hookRes.ok) {
                        const hook = await hookRes.json();
                        webhookIds[repo.full_name] = hook.uuid;
                    }
                } catch {
                    // non-fatal
                }
            }

            if (Object.keys(webhookIds).length > 0) {
                await supabaseAdmin
                    .from('integrations')
                    .update({ webhook_id: JSON.stringify(webhookIds) })
                    .eq('organization_id', orgId)
                    .eq('provider', 'bitbucket');
            }
        }

        // 7. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/repositories?connected=bitbucket`);
    } catch (err) {
        console.error('Bitbucket OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=bitbucket_connection_failed`);
    }
}
