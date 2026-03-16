import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repo');
    const provider = searchParams.get('provider');
    const orgId = searchParams.get('org');

    if (!repoId || !provider || !orgId) {
        return NextResponse.json({ error: 'Missing req parameters' }, { status: 400 });
    }

    try {
        const { data: integ } = await supabase
            .from('integrations')
            .select('access_token')
            .eq('organization_id', orgId)
            .eq('provider', provider)
            .single();

        if (!integ || !integ.access_token) {
            return NextResponse.json({ error: 'Repository provider not connected' }, { status: 400 });
        }

        const token = integ.access_token;
        let prs = [];

        if (provider === 'github') {
            const { data: repo } = await supabase.from('repositories').select('full_name').eq('id', repoId).single();
            if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
            
            const res = await fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=open`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!res.ok) throw new Error('Failed to fetch from GitHub');
            const data = await res.json();
            
            prs = data.map((pr: any) => ({
                number: pr.number,
                title: pr.title,
                branch: pr.head.ref
            }));
        } else if (provider === 'gitlab') {
            const { data: repo } = await supabase.from('repositories').select('provider_repo_id').eq('id', repoId).single();
            if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 });

            const res = await fetch(`https://gitlab.com/api/v4/projects/${repo.provider_repo_id}/merge_requests?state=opened`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) throw new Error('Failed to fetch from GitLab');
            const data = await res.json();
            prs = data.map((pr: any) => ({
                number: pr.iid,
                title: pr.title,
                branch: pr.source_branch
            }));
        } else if (provider === 'bitbucket') {
             const { data: repo } = await supabase.from('repositories').select('full_name').eq('id', repoId).single();
            if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
            
            const parts = repo.full_name.split("/");
            const workspace = parts[0];
            const slug = parts[1];

            const res = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/pullrequests?state=OPEN`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) throw new Error('Failed to fetch from Bitbucket');
            const data = await res.json();
            prs = data.values.map((pr: any) => ({
                number: pr.id,
                title: pr.title,
                branch: pr.source.branch.name
            }));
        }

        return NextResponse.json({ prs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
