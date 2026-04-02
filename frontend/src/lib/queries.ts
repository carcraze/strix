import { supabase } from "@/lib/supabase";

/**
 * Pentests
 */
export async function getPentests(orgId: string) {
    const { data, error } = await supabase
        .from('pentests')
        .select('id, name, status, type, created_at, completed_at, issues_found, report_url, compliance_framework')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createPentest(orgId: string, payload: any) {
    const { data, error } = await supabase
        .from('pentests')
        .insert({
            organization_id: orgId,
            name: payload.name,
            status: 'pending',
            type: payload.type || 'webapp'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Domains
 */
export async function getDomains(orgId: string) {
    const { data, error } = await supabase
        .from('domains')
        .select('id, domain, verified, type, created_at, organization_id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function addDomain(orgId: string, domainName: string) {
    const { data, error } = await supabase
        .from('domains')
        .insert({
            organization_id: orgId,
            domain: domainName,
            verified: false,
            type: 'web_application'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Repositories
 */
export async function getRepositories(orgId: string) {
    const { data, error } = await supabase
        .from('repositories')
        .select('id, full_name, provider, auto_review_enabled, created_at, default_branch, organization_id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function toggleRepoAutoReview(repoId: string, enabled: boolean) {
    const { data, error } = await supabase
        .from('repositories')
        .update({ auto_review_enabled: enabled })
        .eq('id', repoId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Issues
 */

// Columns for list views — skips large text blobs (fix_diff, poc_request etc.)
// that are only needed in the detail/sidebar view. Saves ~60-80% egress on the issues table.
const ISSUE_LIST_COLUMNS = `
    id, title, description, severity, status, scan_type,
    file_path, found_at, snoozed_until, created_at, updated_at,
    is_false_positive, auto_ignore_reason, hours_saved,
    repository_id, domain_id, pentest_id,
    external_issue_url, auto_fix_available,
    package_name, affected_version, fixed_version, cve_id, cve_count,
    repositories(id, full_name),
    domains(id, domain),
    pentests(id, name)
`.trim();

const PAGE_SIZE = 50;

export async function getIssues(orgId: string, page = 0) {
    const from = page * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
        .from('issues')
        .select(ISSUE_LIST_COLUMNS)
        .eq('organization_id', orgId)
        .order('found_at', { ascending: false })
        .range(from, to);

    if (error) throw error;
    return data;
}

// Fetch stats using COUNT only — zero row data transferred across the wire.
// Use these for the metric cards instead of computing from the full issue list.
export async function getIssueStats(orgId: string) {
    const now     = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [open, autoIgnored, newIssues, solved] = await Promise.all([
        supabase.from('issues').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'open'),
        supabase.from('issues').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'ignored').eq('is_false_positive', true),
        supabase.from('issues').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).gte('found_at', weekAgo),
        supabase.from('issues').select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'fixed').gte('updated_at', weekAgo),
    ]);

    // Severity counts for the bar — only open issues, only the severity column
    const { data: sevData } = await supabase
        .from('issues')
        .select('severity')
        .eq('organization_id', orgId)
        .eq('status', 'open');

    const sevCounts = (sevData || []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
    }, {});

    return {
        openTotal:   open.count      ?? 0,
        autoIgnored: autoIgnored.count ?? 0,
        newCount:    newIssues.count  ?? 0,
        solvedCount: solved.count     ?? 0,
        critical:    sevCounts['critical'] ?? 0,
        high:        sevCounts['high']     ?? 0,
        medium:      sevCounts['medium']   ?? 0,
        low:         sevCounts['low']      ?? 0,
        hoursSaved:  0, // computed separately if needed
    };
}

export async function getIssueDetails(issueId: string) {
    const { data, error } = await supabase
        .from('issues')
        .select(`
            *,
            pentests(id, name),
            repositories(id, full_name, provider),
            domains(id, domain)
        `)
        .eq('id', issueId)
        .single();

    if (error) throw error;
    return data;
}

export async function snoozeIssue(issueId: string, until: Date) {
    const { data, error } = await supabase
        .from('issues')
        .update({ snoozed_until: until.toISOString(), status: 'open' })
        .eq('id', issueId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateIssueStatus(issueId: string, status: 'open' | 'in_progress' | 'fixed' | 'ignored') {
    const { data, error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Organization Members
 */
export async function getMembers(orgId: string) {
    const { data, error } = await supabase
        .from('organization_members')
        .select('id, role, status, user_id, user_profiles(id, email, full_name, first_name, last_name, avatar_url)')
        .eq('organization_id', orgId);

    if (error) throw error;
    return data;
}

export async function inviteMember(orgId: string, email: string, role: string) {
    const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
            organization_id: orgId,
            email,
            role,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * PR Reviews
 */
export async function getPrReviews(orgId: string) {
    const { data, error } = await supabase
        .from('pr_reviews')
        .select('*, repositories(full_name, provider)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
