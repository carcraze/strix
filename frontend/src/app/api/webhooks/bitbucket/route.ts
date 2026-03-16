import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BACKEND_URL = process.env.SCANNER_BACKEND_URL || 'http://127.0.0.1:8000';

function verifyBitbucketSignature(secret: string, body: string, signature: string): boolean {
    if (!signature) return false;
    // Bitbucket sends: sha256=<hex>
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const bodyStr = await request.text();
    const signature = request.headers.get('x-hub-signature') || '';
    const eventType = request.headers.get('x-event-key') || '';

    // 1. Verify signature
    const secret = process.env.BITBUCKET_WEBHOOK_SECRET;
    if (secret && !verifyBitbucketSignature(secret, bodyStr, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!['pullrequest:created', 'pullrequest:updated'].includes(eventType)) {
        return NextResponse.json({ received: true, ignored: true, reason: `event_${eventType}` });
    }

    const payload = JSON.parse(bodyStr);
    const pr = payload.pullrequest;
    const repo = payload.repository;

    const repoFullName = repo?.full_name;
    const prId = pr?.id;
    const prTitle = pr?.title;
    const prUrl = pr?.links?.html?.href;
    const branchName = pr?.source?.branch?.name;
    const commitSha = pr?.source?.commit?.hash;
    const authorUsername = pr?.author?.nickname || pr?.author?.display_name;
    const repoUuid = repo?.uuid;
    const cloneUrl = repo?.links?.clone?.find((l: any) => l.name === 'https')?.href;

    try {
        // 2. Lookup the repository in DB
        const { data: repository } = await supabaseAdmin
            .from('repositories')
            .select('id, organization_id, auto_review_enabled, block_merge_on_critical')
            .eq('provider', 'bitbucket')
            .eq('provider_repo_id', repoUuid)
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
                pr_number: prId,
                pr_title: prTitle,
                pr_url: prUrl,
                status: 'running',
                author_username: authorUsername,
                commit_sha: commitSha,
                trigger_source: 'webhook',
                provider: 'bitbucket',
            })
            .select()
            .single();

        if (reviewError) {
            console.error('Failed to insert Bitbucket PR review record:', reviewError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 4. Fetch the user's Bitbucket token
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('access_token')
            .eq('organization_id', repository.organization_id)
            .eq('provider', 'bitbucket')
            .single();

        // 5. Fire scan to backend
        const backendPayload = {
            organization_id: repository.organization_id,
            repository_id: repository.id,
            pr_review_id: reviewRecord.id,
            repo_full_name: repoFullName,
            clone_url: cloneUrl,
            pr_number: prId,
            branch_name: branchName,
            commit_sha: commitSha,
            block_merge_on_critical: repository.block_merge_on_critical,
            provider: 'bitbucket',
            provider_repo_id: repoUuid,
            access_token: integration?.access_token,
        };

        fetch(`${BACKEND_URL}/api/pr-reviews/launch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload),
        }).catch(err => console.error('Failed to launch Bitbucket scan:', err));

        return NextResponse.json({ received: true, launched: true, review_id: reviewRecord.id });

    } catch (err) {
        console.error('Bitbucket webhook error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
