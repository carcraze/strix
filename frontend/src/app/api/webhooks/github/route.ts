import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import crypto from 'crypto';

function verifyGitHubSignature(secret: string, payloadStr: string, signature: string): boolean {
    if (!signature) return false;
    const computedSig = `sha256=${crypto.createHmac('sha256', secret).update(payloadStr).digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig));
}

export async function POST(request: NextRequest) {
    const signature = request.headers.get("x-hub-signature-256") || "";
    const eventType = request.headers.get("x-github-event");
    const bodyStr = await request.text();
    
    // 1. Verify Signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret && !verifyGitHubSignature(secret, bodyStr, signature)) {
        console.error("GitHub webhook signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (eventType !== 'pull_request') {
        // We only care about PRs for now
        return NextResponse.json({ received: true, ignored: true, reason: 'not_pull_request' });
    }

    const payload = JSON.parse(bodyStr);
    const action = payload.action;

    // We only trigger scans on new PRs or updates
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
        return NextResponse.json({ received: true, ignored: true, reason: `action_${action}` });
    }

    const pr = payload.pull_request;
    const repo = payload.repository;
    
    const providerRepoId = repo.id.toString();
    const repoFullName = repo.full_name;
    const prNumber = pr.number;
    const prTitle = pr.title;
    const prUrl = pr.html_url;
    const branchName = pr.head.ref;
    const commitSha = pr.head.sha;
    const authorUsername = pr.user.login;
    const cloneUrl = repo.clone_url;

    // Initialize Supabase Admin
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );

    try {
        // 2. Lookup the repository in our DB
        const { data: repository, error: repoError } = await supabaseAdmin
            .from('repositories')
            .select('id, organization_id, auto_review_enabled, block_merge_on_critical')
            .eq('provider', 'github')
            .eq('provider_repo_id', providerRepoId)
            .single();

        if (repoError || !repository) {
            console.log(`Repository ${repoFullName} not registered in Zentinel. Ignoring.`);
            return NextResponse.json({ received: true, ignored: true, reason: 'repository_not_registered' });
        }

        if (!repository.auto_review_enabled) {
            console.log(`Auto review disabled for ${repoFullName}. Ignoring.`);
            return NextResponse.json({ received: true, ignored: true, reason: 'auto_review_disabled' });
        }

        // 3. Create a pending pr_reviews record
        const { data: reviewRecord, error: reviewError } = await supabaseAdmin
            .from('pr_reviews')
            .insert({
                organization_id: repository.organization_id,
                repository_id: repository.id,
                pr_number: prNumber,
                pr_title: prTitle,
                pr_url: prUrl,
                status: 'pending',
                author_username: authorUsername,
                commit_sha: commitSha
            })
            .select()
            .single();

        if (reviewError) {
            console.error("Failed to insert PR review record:", reviewError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // 4. Trigger the backend to run the scan
        const backendUrl = process.env.NEXT_PUBLIC_SCANNER_BACKEND_URL || "http://127.0.0.1:8000";
        const backendPayload = {
            organization_id: repository.organization_id,
            repository_id: repository.id,
            pr_review_id: reviewRecord.id,
            repo_full_name: repoFullName,
            clone_url: cloneUrl,
            pr_number: prNumber,
            branch_name: branchName,
            commit_sha: commitSha,
            block_merge_on_critical: repository.block_merge_on_critical
        };

        const apiRes = await fetch(`${backendUrl}/api/pr-reviews/launch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We should ideally secure this call if it's external, maybe passing a shared secret
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` 
            },
            body: JSON.stringify(backendPayload)
        });

        if (!apiRes.ok) {
            console.error("Backend failed to launch PR review", await apiRes.text());
        }

        return NextResponse.json({ received: true, launched: true, review_id: reviewRecord.id });

    } catch (err: any) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
