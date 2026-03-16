import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDIRECT_BASE = 'https://app.zentinel.dev';
const REDIRECT_URI = `${REDIRECT_BASE}/api/integrations/callback/github`;
const WEBHOOK_URL = `${REDIRECT_BASE}/api/webhooks/github`;

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
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
        const accessToken = tokenData.access_token;

        // 2. Save token to integrations table
        const { error: integrationError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: orgId,
                provider: 'github',
                access_token: accessToken,
                status: 'connected',
                installed_at: new Date().toISOString(),
            }, { onConflict: 'organization_id,provider' });

        if (integrationError) throw integrationError;

        // 3. Fetch ALL repos from GitHub (public + private) with pagination
        const fetchAllRepos = async (): Promise<any[]> => {
            const all: any[] = [];
            let page = 1;
            while (true) {
                const res = await fetch(
                    `https://api.github.com/user/repos?type=all&per_page=100&page=${page}`,
                    { headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github+json' } }
                );
                const batch: any[] = await res.json();
                if (!Array.isArray(batch) || batch.length === 0) break;
                all.push(...batch);
                if (batch.length < 100) break;
                page++;
            }
            return all;
        };

        const repos = await fetchAllRepos();

        // 4. Save repos to repositories table
        if (repos.length > 0) {
            const repoRows = repos.map((repo) => ({
                organization_id: orgId,
                full_name: repo.full_name,
                provider: 'github',
                provider_repo_id: String(repo.id),
                default_branch: repo.default_branch || 'main',
                auto_review_enabled: false,
            }));

            await supabaseAdmin
                .from('repositories')
                .upsert(repoRows, { onConflict: 'organization_id,provider_repo_id', ignoreDuplicates: true });
        }

        // 5. Auto-register Zentinel webhook on each repo (fire-and-forget, best effort)
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        if (webhookSecret) {
            const ghHeaders = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
            };

            // Register webhook for each repo we have push access to
            const webhookIds: Record<string, string> = {};
            for (const repo of repos) {
                if (repo.permissions?.push || repo.permissions?.admin) {
                    try {
                        const hookRes = await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
                            method: 'POST',
                            headers: ghHeaders,
                            body: JSON.stringify({
                                name: 'web',
                                active: true,
                                events: ['pull_request'],
                                config: {
                                    url: WEBHOOK_URL,
                                    content_type: 'json',
                                    secret: webhookSecret,
                                },
                            }),
                        });
                        if (hookRes.ok) {
                            const hook = await hookRes.json();
                            webhookIds[repo.full_name] = String(hook.id);
                        }
                    } catch {
                        // non-fatal, skip if webhook already exists or no admin access
                    }
                }
            }

            // Store webhook_ids as JSON in integrations table
            if (Object.keys(webhookIds).length > 0) {
                await supabaseAdmin
                    .from('integrations')
                    .update({ webhook_id: JSON.stringify(webhookIds) })
                    .eq('organization_id', orgId)
                    .eq('provider', 'github');
            }
        }

        // 6. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/repositories?connected=github`);
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=github_connection_failed`);
    }
}
