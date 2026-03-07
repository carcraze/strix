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
