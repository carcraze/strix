import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BACKEND_URL = process.env.SCANNER_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { repo_id, pr_number, branch_name, provider, trigger } = body;

    if (!repo_id || !provider || (!pr_number && !branch_name)) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lookup repo + org in DB
    const { data: repo, error: repoError } = await supabaseAdmin
        .from('repositories')
        .select('id, organization_id, full_name, provider_repo_id, default_branch, block_merge_on_critical')
        .eq('id', repo_id)
        .single();

    if (repoError || !repo) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get OAuth token for this provider
    const { data: integration } = await supabaseAdmin
        .from('integrations')
        .select('access_token')
        .eq('organization_id', repo.organization_id)
        .eq('provider', provider)
        .single();

    if (!integration?.access_token) {
        return NextResponse.json({ error: `No ${provider} integration found` }, { status: 400 });
    }

    const accessToken = integration.access_token;
    let resolvedPrNumber = pr_number;
    let resolvedBranch = branch_name || repo.default_branch;
    let commitSha = '';
    let prTitle = `Manual scan — branch ${resolvedBranch}`;
    let prUrl = '';
    let cloneUrl = '';

    // Resolve clone URL and PR details from provider API
    try {
        if (provider === 'github') {
            const ghHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github+json' };

            if (pr_number) {
                const prRes = await fetch(`https://api.github.com/repos/${repo.full_name}/pulls/${pr_number}`, { headers: ghHeaders });
                if (prRes.ok) {
                    const pr = await prRes.json();
                    prTitle = pr.title;
                    prUrl = pr.html_url;
                    resolvedBranch = pr.head.ref;
                    commitSha = pr.head.sha;
                }
            } else {
                // branch mode — get latest commit
                const branchRes = await fetch(`https://api.github.com/repos/${repo.full_name}/branches/${branch_name}`, { headers: ghHeaders });
                if (branchRes.ok) {
                    const b = await branchRes.json();
                    commitSha = b.commit.sha;
                }
            }
            const repoRes = await fetch(`https://api.github.com/repos/${repo.full_name}`, { headers: ghHeaders });
            if (repoRes.ok) {
                const rData = await repoRes.json();
                cloneUrl = rData.clone_url;
            }
        } else if (provider === 'gitlab') {
            const glHeaders = { 'Authorization': `Bearer ${accessToken}` };
            const projectId = repo.provider_repo_id;

            if (pr_number) {
                const mrRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${pr_number}`, { headers: glHeaders });
                if (mrRes.ok) {
                    const mr = await mrRes.json();
                    prTitle = mr.title;
                    prUrl = mr.web_url;
                    resolvedBranch = mr.source_branch;
                    commitSha = mr.sha;
                }
            } else {
                const branchRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/repository/branches/${encodeURIComponent(branch_name)}`, { headers: glHeaders });
                if (branchRes.ok) {
                    const b = await branchRes.json();
                    commitSha = b.commit.id;
                }
            }
            const projRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}`, { headers: glHeaders });
            if (projRes.ok) {
                const proj = await projRes.json();
                cloneUrl = proj.http_url_to_repo;
            }
        } else if (provider === 'bitbucket') {
            const [workspace, slug] = repo.full_name.split('/');
            const bbHeaders = { 'Authorization': `Bearer ${accessToken}` };

            if (pr_number) {
                const prRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/pullrequests/${pr_number}`, { headers: bbHeaders });
                if (prRes.ok) {
                    const pr = await prRes.json();
                    prTitle = pr.title;
                    prUrl = pr.links.html.href;
                    resolvedBranch = pr.source.branch.name;
                    commitSha = pr.source.commit.hash;
                }
            } else {
                const branchRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/refs/branches/${branch_name}`, { headers: bbHeaders });
                if (branchRes.ok) {
                    const b = await branchRes.json();
                    commitSha = b.target.hash;
                }
            }
            const repoRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}`, { headers: bbHeaders });
            if (repoRes.ok) {
                const r = await repoRes.json();
                cloneUrl = r.links.clone?.find((l: any) => l.name === 'https')?.href;
            }
        }
    } catch (err) {
        console.error('Failed to resolve PR details:', err);
    }

    // Insert pr_reviews row with running status
    const { data: reviewRecord, error: reviewError } = await supabaseAdmin
        .from('pr_reviews')
        .insert({
            organization_id: repo.organization_id,
            repository_id: repo.id,
            pr_number: resolvedPrNumber || 0,
            pr_title: prTitle,
            pr_url: prUrl,
            status: 'running',
            commit_sha: commitSha,
            trigger_source: trigger || 'manual',
            provider,
        })
        .select()
        .single();

    if (reviewError) {
        return NextResponse.json({ error: 'Failed to create review record' }, { status: 500 });
    }

    // Fire scan to backend
    const backendPayload = {
        organization_id: repo.organization_id,
        repository_id: repo.id,
        pr_review_id: reviewRecord.id,
        repo_full_name: repo.full_name,
        clone_url: cloneUrl,
        pr_number: resolvedPrNumber || 0,
        branch_name: resolvedBranch,
        commit_sha: commitSha,
        block_merge_on_critical: repo.block_merge_on_critical || false,
        provider,
    };

    fetch(`${BACKEND_URL}/api/pr-reviews/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
    }).catch(err => console.error('Failed to launch manual PR review:', err));

    return NextResponse.json({ status: 'queued', review_id: reviewRecord.id });
}
