export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export type ScanType = 'quick' | 'web_api' | 'full_stack' | 'compliance';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type Plan = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';

export interface Organization {
    id: string;
    name: string;
    plan: Plan;
    slug?: string;
    scan_credits?: {
        quick: number;
        web_api: number;
        full_stack: number;
        compliance: number;
    };
    created_at: string;
}

export interface Workspace {
    id: string;
    name: string;
    role: UserRole;
    plan?: Plan;
    slug?: string;
}

export interface Pentest {
    id: string;
    name: string;
    organization_id: string;
    status: ScanStatus;
    type?: string;
    scan_type?: ScanType;
    scan_mode?: string;
    credit_source?: 'one_time' | 'subscription';
    report_url?: string;
    context_provided?: boolean;
    issues_count?: number;
    created_at: string;
    updated_at?: string;
}

export interface Domain {
    id: string;
    domain: string;
    organization_id: string;
    status: 'pending' | 'verified' | 'failed';
    created_at: string;
}

export interface Repository {
    id: string;
    name: string;
    full_name: string;
    organization_id: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
    default_branch: string;
    created_at: string;
}

export interface Issue {
    id: string;
    title: string;
    severity: SeverityLevel;
    status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
    pentest_id: string;
    organization_id: string;
    description?: string;
    proof_of_concept?: string;
    remediation?: string;
    created_at: string;
}
