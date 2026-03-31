import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './send';
import {
    scanCompleteTemplate,
    criticalFindingTemplate,
    prReviewCompleteTemplate,
    weeklySummaryTemplate,
} from './templates';

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Helper: get user email from auth.users ────────────────────────────────────
async function getUserEmail(userId: string): Promise<string | null> {
    const { data } = await adminClient.auth.admin.getUserById(userId);
    return data?.user?.email || null;
}

// ── Helper: get notification preferences for an org ──────────────────────────
async function getOrgPrefs(orgId: string) {
    const { data } = await adminClient
        .from('notification_preferences')
        .select('*')
        .eq('organization_id', orgId);
    return data || [];
}

// ── Helper: get org name ──────────────────────────────────────────────────────
async function getOrgName(orgId: string): Promise<string> {
    const { data } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
    return data?.name || 'Your Organization';
}

// ── 1. Pentest / Scan Complete ────────────────────────────────────────────────
export async function notifyScanComplete(pentestId: string) {
    try {
        const { data: pentest } = await adminClient
            .from('pentests')
            .select('organization_id, name, issues_found, duration_seconds')
            .eq('id', pentestId)
            .single();

        if (!pentest) return;

        const { data: issues } = await adminClient
            .from('issues')
            .select('severity')
            .eq('pentest_id', pentestId);

        const sev = (s: string) => (issues || []).filter(i => i.severity === s).length;
        const critical = sev('critical'), high = sev('high'), medium = sev('medium'), low = sev('low');

        const [orgName, prefs] = await Promise.all([
            getOrgName(pentest.organization_id),
            getOrgPrefs(pentest.organization_id),
        ]);

        for (const pref of prefs) {
            if (!pref.email_scan_completed) continue;
            const email = await getUserEmail(pref.user_id);
            if (!email) continue;

            await sendEmail(
                email,
                `Pentest complete — ${pentest.issues_found || 0} issues found | ${orgName}`,
                scanCompleteTemplate({
                    orgName,
                    pentestName: pentest.name,
                    pentestId,
                    issuesFound: pentest.issues_found || 0,
                    critical, high, medium, low,
                    durationSeconds: pentest.duration_seconds,
                }),
            );
        }
    } catch (err: any) {
        console.error('[NOTIFY] notifyScanComplete failed:', err.message);
    }
}

// ── 2. Critical / High Issue Found ───────────────────────────────────────────
export async function notifyNewFinding(
    issueId: string,
    orgId: string,
    severity: string,
    source: 'pentest' | 'pr_review',
    sourceId: string,
) {
    const sev = severity.toLowerCase();
    if (!['critical', 'high'].includes(sev)) return; // only alert on critical/high

    try {
        const { data: issue } = await adminClient
            .from('issues')
            .select('title')
            .eq('id', issueId)
            .single();

        if (!issue) return;

        const [orgName, prefs] = await Promise.all([
            getOrgName(orgId),
            getOrgPrefs(orgId),
        ]);

        for (const pref of prefs) {
            const wantsCritical = sev === 'critical' && pref.email_critical_vulns;
            const wantsHigh     = sev === 'high'     && pref.email_high_vulns;
            if (!wantsCritical && !wantsHigh) continue;

            const email = await getUserEmail(pref.user_id);
            if (!email) continue;

            await sendEmail(
                email,
                `[${sev.toUpperCase()}] ${issue.title} — ${orgName}`,
                criticalFindingTemplate({
                    orgName,
                    issueTitle: issue.title,
                    severity: sev,
                    issueId,
                    source,
                    sourceId,
                }),
            );
        }
    } catch (err: any) {
        console.error('[NOTIFY] notifyNewFinding failed:', err.message);
    }
}

// ── 3. PR Review Complete ─────────────────────────────────────────────────────
export async function notifyPrReviewComplete(prReviewId: string) {
    try {
        const { data: pr } = await adminClient
            .from('pr_reviews')
            .select('organization_id, repository_id, pr_number, pr_title, issues_found, critical_count, high_count, repositories(full_name)')
            .eq('id', prReviewId)
            .single();

        if (!pr) return;

        const [orgName, prefs] = await Promise.all([
            getOrgName(pr.organization_id),
            getOrgPrefs(pr.organization_id),
        ]);

        for (const pref of prefs) {
            if (!pref.email_pr_review) continue;
            const email = await getUserEmail(pref.user_id);
            if (!email) continue;

            const repoName = (pr.repositories as any)?.full_name || 'repository';

            await sendEmail(
                email,
                `PR #${pr.pr_number} security review — ${pr.issues_found > 0 ? `${pr.issues_found} issues` : 'passed'} | ${repoName}`,
                prReviewCompleteTemplate({
                    orgName,
                    repoName,
                    prNumber:    pr.pr_number,
                    prTitle:     pr.pr_title || `PR #${pr.pr_number}`,
                    issuesFound: pr.issues_found || 0,
                    critical:    pr.critical_count || 0,
                    high:        pr.high_count || 0,
                    prReviewId,
                }),
            );
        }
    } catch (err: any) {
        console.error('[NOTIFY] notifyPrReviewComplete failed:', err.message);
    }
}

// ── 4. Weekly Summary (called by cron) ───────────────────────────────────────
export async function sendWeeklySummary(orgId: string, userId: string) {
    try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [orgName, email, { data: pentests }, { data: issues }] = await Promise.all([
            getOrgName(orgId),
            getUserEmail(userId),
            adminClient.from('pentests').select('id').eq('organization_id', orgId).gte('created_at', weekAgo),
            adminClient.from('issues').select('title, severity').eq('organization_id', orgId).in('status', ['open', 'in_progress']),
        ]);

        if (!email) return;

        const sev = (s: string) => (issues || []).filter(i => i.severity === s).length;
        const topFindings = (issues || [])
            .filter(i => ['critical', 'high'].includes(i.severity))
            .slice(0, 5)
            .map(i => ({ title: i.title, severity: i.severity }));

        await sendEmail(
            email,
            `Weekly Security Summary — ${orgName}`,
            weeklySummaryTemplate({
                orgName,
                scansRun:    pentests?.length || 0,
                issuesFound: issues?.length || 0,
                critical:    sev('critical'),
                high:        sev('high'),
                topFindings,
            }),
        );
    } catch (err: any) {
        console.error('[NOTIFY] sendWeeklySummary failed:', err.message);
    }
}
