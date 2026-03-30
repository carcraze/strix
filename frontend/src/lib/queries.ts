import { supabase } from "@/lib/supabase";

/**
 * Pentests
 */
export async function getPentests(orgId: string) {
    const { data, error } = await supabase
        .from('pentests')
        .select('*')
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
        .select('*')
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
        .select('*')
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
export async function getIssues(orgId: string) {
    const { data, error } = await supabase
        .from('issues')
        .select(`
            *,
            pentests(id, name),
            repositories(id, full_name, name, provider),
            domains(id, domain)
        `)
        .eq('organization_id', orgId)
        .order('found_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getIssueDetails(issueId: string) {
    const { data, error } = await supabase
        .from('issues')
        .select(`
            *,
            pentests(id, name),
            repositories(id, full_name, name, provider),
            domains(id, domain)
        `)
        .eq('id', issueId)
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
        .select('*, user_profiles(*)')
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
