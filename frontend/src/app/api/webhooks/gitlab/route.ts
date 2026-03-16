import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BACKEND_URL = process.env.SCANNER_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    // 1. Verify GitLab token header
    const token = request.headers.get('x-gitlab-token');
    const expectedSecret = process.env.GITLAB_WEBHOOK_SECRET;
    if (expectedSecret && token !== expectedSecret) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = await request.json();

    // Only process merge_request events with open/update actions
    if (payload.object_kind !== 'merge_request') {
        return NextResponse.json({ received: true, ignored: true, reason: 'not_merge_request' });
    }

    const attrs = payload.object_attributes;
    if (!['open', 'update', 'reopen'].includes(attrs?.action)) {
        return NextResponse.json({ received: true, ignored: true, reason: `action_${attrs?.action}` });
    }

    const projectId = String(payload.project?.id);
    const mrIid = attrs.iid; // GitLab uses `iid` (internal ID) for MR number
    const mrTitle = attrs.title;
    const mrUrl = attrs.url;
    const branchName = attrs.source_branch;
    const commitSha = attrs.last_commit?.id;
    const authorUsername = payload.user?.username;

    try {
        // 2. Lookup the repository
        const { data: repository } = await supabaseAdmin
            .from('repositories')
            .select('id, organization_id, auto_review_enabled, block_merge_on_critical, full_name')
            .eq('provider', 'gitlab')
            .eq('provider_repo_id', projectId)
            .single();

        if (!repository) {
            return NextResponse.json({ received: true, ignored: true, reason: 'repository_not_registered' });
        }

        if (!repository.auto_review_enabled) {
            return NextResponse.json({ received: true, ignored: true, reason: 'auto_review_disabled' });
        }

        // 3. Insert pr_reviews record with running status immediately
        const { data: reviewRecord, error: reviewError } = await supabaseAdmin
            .from('pr_reviews')
            .insert({
                organization_id: repository.organization_id,
                repository_id: repository.id,
                pr_number: mrIid,
                pr_title: mrTitle,
                pr_url: mrUrl,
                status: 'running',
                author_username: authorUsername,
                commit_sha: commitSha,
                trigger_source: 'webhook',
                provider: 'gitlab',
            })
            .select()
            .single();

        if (reviewError) {
            console.error('Failed to insert GitLab MR review record:', reviewError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 4. Fetch the user's GitLab token for the backend
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('access_token')
            .eq('organization_id', repository.organization_id)
            .eq('provider', 'gitlab')
            .single();

        // 5. Fire scan to backend (don't await — return 200 immediately)
        const backendPayload = {
            organization_id: repository.organization_id,
            repository_id: repository.id,
            pr_review_id: reviewRecord.id,
            repo_full_name: repository.full_name,
            clone_url: payload.project?.git_http_url || payload.project?.http_url,
            pr_number: mrIid,
            branch_name: branchName,
            commit_sha: commitSha,
            block_merge_on_critical: repository.block_merge_on_critical,
            provider: 'gitlab',
            provider_repo_id: projectId,
            access_token: integration?.access_token,
        };

        fetch(`${BACKEND_URL}/api/pr-reviews/launch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload),
        }).catch(err => console.error('Failed to launch GitLab scan:', err));

        return NextResponse.json({ received: true, launched: true, review_id: reviewRecord.id });

    } catch (err) {
        console.error('GitLab webhook error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
