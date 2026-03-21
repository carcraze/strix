import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/repos?org=<orgId>&provider=github&search=<term>
// Lists repos from the connected provider using the stored access token
export async function GET(req: NextRequest) {
    const orgId = req.nextUrl.searchParams.get('org');
    const provider = req.nextUrl.searchParams.get('provider') || 'github';
    const search = req.nextUrl.searchParams.get('search') || '';

    if (!orgId) return NextResponse.json({ error: 'Missing org' }, { status: 400 });

    // Fetch the stored access token for this org + provider
    const { data: integration, error } = await supabaseAdmin
        .from('integrations')
        .select('access_token, provider_username')
        .eq('organization_id', orgId)
        .eq('provider', provider)
        .single();

    if (error || !integration?.access_token) {
        return NextResponse.json({ error: 'Not connected', repos: [] });
    }

    const token = integration.access_token;
    let repos: any[] = [];

    try {
        if (provider === 'github') {
            // Fetch all repos the user has access to (includes orgs they belong to)
            const ghRes = await fetch(
                `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member${search ? `&q=${encodeURIComponent(search)}` : ''}`,
                { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
            );
            const ghData = await ghRes.json();
            if (Array.isArray(ghData)) {
                repos = ghData
                    .filter((r: any) => !search || r.full_name.toLowerCase().includes(search.toLowerCase()))
                    .map((r: any) => ({
                        id: String(r.id),
                        name: r.full_name,
                        description: r.description,
                        private: r.private,
                        url: r.html_url,
                        default_branch: r.default_branch,
                        language: r.language,
                        stars: r.stargazers_count,
                        provider: 'github',
                    }));
            }
        }

        else if (provider === 'gitlab') {
            const glRes = await fetch(
                `https://gitlab.com/api/v4/projects?membership=true&per_page=100&order_by=last_activity_at${search ? `&search=${encodeURIComponent(search)}` : ''}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const glData = await glRes.json();
            if (Array.isArray(glData)) {
                repos = glData.map((r: any) => ({
                    id: String(r.id),
                    name: r.path_with_namespace,
                    description: r.description,
                    private: r.visibility !== 'public',
                    url: r.web_url,
                    default_branch: r.default_branch,
                    language: null,
                    stars: r.star_count,
                    provider: 'gitlab',
                }));
            }
        }

        else if (provider === 'bitbucket') {
            const bbRes = await fetch(
                `https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100${search ? `&q=name~"${search}"` : ''}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const bbData = await bbRes.json();
            if (Array.isArray(bbData?.values)) {
                repos = bbData.values.map((r: any) => ({
                    id: r.uuid,
                    name: r.full_name,
                    description: r.description,
                    private: r.is_private,
                    url: r.links?.html?.href,
                    default_branch: r.mainbranch?.name,
                    language: r.language,
                    stars: 0,
                    provider: 'bitbucket',
                }));
            }
        }
    } catch (err) {
        console.error(`[Repos API] ${provider} fetch error:`, err);
    }

    return NextResponse.json({ repos });
}

// POST /api/repos
// Connects a specific repository, saves it to the DB, and registers the Zentinel webhook
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orgId, provider, repoId, repoName, defaultBranch } = body;

        if (!orgId || !provider || !repoId || !repoName) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('access_token, webhook_id')
            .eq('organization_id', orgId)
            .eq('provider', provider)
            .single();

        if (!integration?.access_token) {
            return NextResponse.json({ error: 'Not connected' }, { status: 400 });
        }

        const REDIRECT_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentinel.dev';
        const WEBHOOK_URL = `${REDIRECT_BASE}/api/webhooks/${provider}`;
        let newHookId: string | null = null;
        let webhookKey = repoName; // default map key

        // 1. Register Webhook
        if (provider === 'github') {
            const secret = process.env.GITHUB_WEBHOOK_SECRET;
            if (secret) {
                const res = await fetch(`https://api.github.com/repos/${repoName}/hooks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${integration.access_token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'web',
                        active: true,
                        events: ['pull_request'],
                        config: { url: WEBHOOK_URL, content_type: 'json', secret },
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newHookId = String(data.id);
                } else {
                    const errorResponse = await res.text();
                    console.error('GitHub webhook error:', errorResponse);
                    // allow proceeding even if webhook fails, could be permissions issue
                }
            }
        } else if (provider === 'gitlab') {
            webhookKey = repoId; // Gitlab uses numerical project ID
            const secret = process.env.GITLAB_WEBHOOK_SECRET;
            if (secret) {
                const res = await fetch(`https://gitlab.com/api/v4/projects/${repoId}/hooks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${integration.access_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: WEBHOOK_URL, merge_requests_events: true, token: secret }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newHookId = String(data.id);
                }
            }
        } else if (provider === 'bitbucket') {
            const secret = process.env.BITBUCKET_WEBHOOK_SECRET;
            if (secret) {
                const res = await fetch(`https://api.bitbucket.org/2.0/repositories/${repoName}/hooks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${integration.access_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description: 'Zentinel PR Security Review',
                        url: WEBHOOK_URL,
                        active: true,
                        events: ['pullrequest:created', 'pullrequest:updated'],
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    newHookId = String(data.uuid);
                }
            }
        }

        // 2. Update webhook mapping
        if (newHookId) {
            let webhookMap: Record<string, string> = {};
            try {
                if (integration.webhook_id) {
                    webhookMap = typeof integration.webhook_id === 'string'
                        ? JSON.parse(integration.webhook_id)
                        : integration.webhook_id;
                }
            } catch (e) {
                console.error('Failed to parse existing webhooks', e);
            }
            webhookMap[webhookKey] = newHookId;

            await supabaseAdmin
                .from('integrations')
                .update({ webhook_id: JSON.stringify(webhookMap) })
                .eq('organization_id', orgId)
                .eq('provider', provider);
        }

        // 3. Upsert into repositories table
        const { error: upsertError } = await supabaseAdmin
            .from('repositories')
            .upsert({
                organization_id: orgId,
                full_name: repoName,
                provider: provider,
                provider_repo_id: repoId,
                default_branch: defaultBranch || 'main',
                auto_review_enabled: false,
            }, { onConflict: 'organization_id,provider_repo_id', ignoreDuplicates: false });

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true, message: 'Repository connected' });
    } catch (err: any) {
        console.error('Failed to connect repo:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/repos
// Disconnects a specific repository, deletes it from DB, and removes the webhook
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { orgId, provider, repoId, repoName } = body;

        if (!orgId || !provider || !repoId || !repoName) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('access_token, webhook_id')
            .eq('organization_id', orgId)
            .eq('provider', provider)
            .single();

        if (integration?.access_token) {
            let webhookMap: Record<string, string> = {};
            try {
                if (integration.webhook_id) {
                    webhookMap = typeof integration.webhook_id === 'string'
                        ? JSON.parse(integration.webhook_id)
                        : integration.webhook_id;
                }
            } catch (e) {
                // ignore
            }

            const webhookKey = provider === 'gitlab' ? repoId : repoName;
            const hookId = webhookMap[webhookKey];

            // 1. Deregister Webhook
            if (hookId) {
                if (provider === 'github') {
                    await fetch(`https://api.github.com/repos/${repoName}/hooks/${hookId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${integration.access_token}`, 'Accept': 'application/vnd.github+json' },
                    });
                } else if (provider === 'gitlab') {
                    await fetch(`https://gitlab.com/api/v4/projects/${repoId}/hooks/${hookId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${integration.access_token}` },
                    });
                } else if (provider === 'bitbucket') {
                    await fetch(`https://api.bitbucket.org/2.0/repositories/${repoName}/hooks/${hookId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${integration.access_token}` },
                    });
                }

                // 2. Update webhook mapping
                delete webhookMap[webhookKey];
                await supabaseAdmin
                    .from('integrations')
                    .update({ webhook_id: JSON.stringify(webhookMap) })
                    .eq('organization_id', orgId)
                    .eq('provider', provider);
            }
        }

        // 3. Delete from repositories table
        const { error: delError } = await supabaseAdmin
            .from('repositories')
            .delete()
            .eq('organization_id', orgId)
            .eq('provider', provider)
            .eq('provider_repo_id', repoId);

        if (delError) throw delError;

        return NextResponse.json({ success: true, message: 'Repository disconnected' });
    } catch (err: any) {
        console.error('Failed to disconnect repo:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
