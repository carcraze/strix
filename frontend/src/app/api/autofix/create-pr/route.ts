import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Parse a unified diff to extract (filename → new content lines) ──────────
function parseDiff(diff: string): Map<string, { path: string; hunks: string[] }> {
    const files = new Map<string, { path: string; hunks: string[] }>();
    const fileBlocks = diff.split(/^diff --git /m).filter(Boolean);

    for (const block of fileBlocks) {
        const bMatch = block.match(/b\/(.+?)\n/);
        if (!bMatch) continue;
        const path = bMatch[1].trim();
        const hunks: string[] = [];
        const hunkBlocks = block.split(/^@@/m).slice(1);
        for (const hunk of hunkBlocks) {
            hunks.push('@@' + hunk);
        }
        if (hunks.length > 0) {
            files.set(path, { path, hunks });
        }
    }
    return files;
}

// ── Apply diff hunks to a file's lines ───────────────────────────────────────
function applyHunks(originalLines: string[], hunks: string[]): string {
    const lines = [...originalLines];
    let offset = 0;

    for (const hunk of hunks) {
        const headerMatch = hunk.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (!headerMatch) continue;

        const origStart  = parseInt(headerMatch[1]) - 1; // 0-indexed
        const origCount  = parseInt(headerMatch[2] ?? '1');
        const hunkLines  = hunk.split('\n').slice(1); // skip header line

        const additions: string[] = [];
        let removals = 0;

        for (const line of hunkLines) {
            if (line.startsWith('+')) additions.push(line.slice(1));
            else if (line.startsWith('-')) removals++;
            else if (line.startsWith(' ')) additions.push(line.slice(1));
        }

        lines.splice(origStart + offset, removals, ...additions);
        offset += additions.length - removals;
    }

    return lines.join('\n');
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(
        req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { issue_id } = await req.json();
    if (!issue_id) return NextResponse.json({ error: 'issue_id required' }, { status: 400 });

    // ── Fetch issue ───────────────────────────────────────────────────────────
    const { data: issue } = await adminClient
        .from('issues')
        .select('*, repositories(full_name, default_branch, organization_id, provider)')
        .eq('id', issue_id)
        .single();

    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    if (!issue.repository_id) return NextResponse.json({ error: 'Issue has no linked repository — AutoFix requires a repo' }, { status: 400 });

    const repo     = issue.repositories as any;
    const orgId    = repo.organization_id || issue.organization_id;
    const provider = repo.provider || 'github';
    const repoName = repo.full_name;
    const branch   = repo.default_branch || 'main';

    // ── Fetch OAuth token ─────────────────────────────────────────────────────
    const { data: integ } = await adminClient
        .from('integrations')
        .select('access_token')
        .eq('organization_id', orgId)
        .eq('provider', provider)
        .single();

    if (!integ?.access_token) return NextResponse.json({ error: `No ${provider} integration found. Connect your repo in Integrations first.` }, { status: 400 });

    const token = integ.access_token;
    const gh    = (path: string, opts?: RequestInit) =>
        fetch(`https://api.github.com${path}`, {
            ...opts,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                ...(opts?.headers || {}),
            },
        });

    try {
        // ── Get base branch SHA ───────────────────────────────────────────────
        const refRes  = await gh(`/repos/${repoName}/git/ref/heads/${branch}`);
        if (!refRes.ok) throw new Error(`Could not find branch '${branch}' in ${repoName}`);
        const refData = await refRes.json();
        const baseSha = refData.object.sha;

        // ── Create fix branch ─────────────────────────────────────────────────
        const fixBranch = `zentinel/fix-${issue_id.slice(0, 8)}`;
        const branchRes = await gh(`/repos/${repoName}/git/refs`, {
            method: 'POST',
            body: JSON.stringify({ ref: `refs/heads/${fixBranch}`, sha: baseSha }),
        });
        // 422 = branch already exists — that's fine, reuse it
        if (!branchRes.ok && branchRes.status !== 422) {
            const err = await branchRes.json();
            throw new Error(`Failed to create branch: ${err.message}`);
        }

        // ── Apply diff or create fix guidance file ────────────────────────────
        const commits: string[] = [];

        if (issue.fix_diff && issue.fix_diff.includes('@@')) {
            // Try to apply the actual diff
            const diffFiles = parseDiff(issue.fix_diff);
            for (const [filePath, { hunks }] of diffFiles) {
                try {
                    // Get current file content
                    const fileRes  = await gh(`/repos/${repoName}/contents/${filePath}?ref=${fixBranch}`);
                    if (!fileRes.ok) continue;
                    const fileData = await fileRes.json();
                    const original = Buffer.from(fileData.content, 'base64').toString('utf-8');
                    const originalLines = original.split('\n');

                    // Apply hunks
                    const updated = applyHunks(originalLines, hunks);

                    // Commit the change
                    const updateRes = await gh(`/repos/${repoName}/contents/${filePath}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            message: `fix(security): ${issue.title.slice(0, 72)} [Zentinel AutoFix]`,
                            content: Buffer.from(updated).toString('base64'),
                            sha: fileData.sha,
                            branch: fixBranch,
                        }),
                    });
                    if (updateRes.ok) commits.push(filePath);
                } catch {
                    // Skip files that can't be patched
                }
            }
        }

        // If no diff was applied — create a SECURITY_FIX.md as a guide
        if (commits.length === 0) {
            const fixContent = [
                `# Security Fix: ${issue.title}`,
                '',
                `**Severity:** ${issue.severity?.toUpperCase()}`,
                `**Found by:** Zentinel Security Engine`,
                '',
                '## Description',
                issue.description || 'See issue details in Zentinel dashboard.',
                '',
                '## How to Fix',
                issue.fix_description || 'No fix guidance available.',
                '',
                issue.fix_diff ? '## Suggested Diff\n```diff\n' + issue.fix_diff + '\n```' : '',
                '',
                `## Reference`,
                `Issue ID: ${issue_id}`,
                `Generated by Zentinel · zentinel.dev`,
            ].join('\n');

            const guideRes = await gh(`/repos/${repoName}/contents/SECURITY_FIX_${issue_id.slice(0, 8)}.md`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `fix(security): ${issue.title.slice(0, 72)} [Zentinel AutoFix]`,
                    content: Buffer.from(fixContent).toString('base64'),
                    branch: fixBranch,
                }),
            });
            if (guideRes.ok) commits.push('SECURITY_FIX.md');
        }

        // ── Open the PR ───────────────────────────────────────────────────────
        const sevEmoji  = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[issue.severity] || '🔵';
        const prTitle   = `${sevEmoji} [Zentinel AutoFix] ${issue.title}`;
        const prBody    = [
            `## ${sevEmoji} Security Fix — ${issue.severity?.toUpperCase()}`,
            '',
            `**${issue.title}**`,
            '',
            issue.description ? `### What's the issue?\n${issue.description}` : '',
            '',
            issue.fix_description ? `### How is it fixed?\n${issue.fix_description}` : '',
            '',
            commits.length > 0 ? `### Files changed\n${commits.map(f => `- \`${f}\``).join('\n')}` : '',
            issue.fix_diff ? `\n### Diff\n\`\`\`diff\n${issue.fix_diff}\n\`\`\`` : '',
            '',
            '---',
            `> Generated by [Zentinel Security Engine](https://zentinel.dev) · Issue \`${issue_id.slice(0, 8)}\``,
        ].filter(Boolean).join('\n');

        const prRes  = await gh(`/repos/${repoName}/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title: prTitle,
                body:  prBody,
                head:  fixBranch,
                base:  branch,
                draft: false,
            }),
        });

        if (!prRes.ok) {
            const prErr = await prRes.json();
            // PR might already exist
            if (prErr.errors?.[0]?.message?.includes('already exists')) {
                return NextResponse.json({ error: 'A fix PR for this issue already exists on GitHub.' }, { status: 409 });
            }
            throw new Error(`Failed to create PR: ${prErr.message}`);
        }

        const pr = await prRes.json();

        // ── Save PR URL to issue ──────────────────────────────────────────────
        await adminClient
            .from('issues')
            .update({ external_issue_url: pr.html_url })
            .eq('id', issue_id);

        return NextResponse.json({
            pr_url:    pr.html_url,
            pr_number: pr.number,
            branch:    fixBranch,
            files:     commits,
        });

    } catch (err: any) {
        console.error('[AUTOFIX]', err.message);
        return NextResponse.json({ error: err.message || 'Failed to create PR' }, { status: 500 });
    }
}
