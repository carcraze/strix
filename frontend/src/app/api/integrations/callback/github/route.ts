import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REDIRECT_BASE = 'https://app.zentinel.dev';
const REDIRECT_URI = `${REDIRECT_BASE}/api/integrations/callback/github`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const rawState = searchParams.get('state');

    if (!code || !rawState) {
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=missing_callback_params`);
    }

    // state may be base64 JSON ({ orgId }) or plain orgId (legacy)
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
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
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

        // 3. Fetch ALL repos from GitHub (public + private, user + org) with pagination
        const fetchAllRepos = async (): Promise<any[]> => {
            const all: any[] = [];
            let page = 1;
            while (true) {
                const res = await fetch(
                    `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member&sort=updated`,
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

        // 5. Redirect to dashboard
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/repositories?connected=github`);
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        return NextResponse.redirect(`${REDIRECT_BASE}/dashboard/integrations?error=github_connection_failed`);
    }
}
