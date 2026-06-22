export type PlanTier = 'starter' | 'growth' | 'scale' | 'enterprise';

export interface PlanLimits {
    workspaces: number;
    domains: number;
    repositories: number;
    scansPerMonth: number;
    teamMembers: number;
    scanTypes: string[];
    scheduledScans: boolean;
    prReviews: boolean;
    complianceReports: boolean;
    cloudScanning: boolean;
    jiraLinear: boolean;
    azureDevops: boolean;
    pagerduty: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    starter: {
        workspaces: 1,
        domains: 1,
        repositories: 3,
        scansPerMonth: 3,
        teamMembers: 2,
        scanTypes: ['blackbox', 'whitebox'],
        scheduledScans: false,
        prReviews: true,
        complianceReports: false,
        cloudScanning: false,
        jiraLinear: false,
        azureDevops: false,
        pagerduty: false,
    },
    growth: {
        workspaces: 3,
        domains: 5,
        repositories: 15,
        scansPerMonth: Infinity,
        teamMembers: 5,
        scanTypes: ['blackbox', 'whitebox'],
        scheduledScans: true,
        prReviews: true,
        complianceReports: true,
        cloudScanning: true,
        jiraLinear: true,
        azureDevops: false,
        pagerduty: false,
    },
    scale: {
        workspaces: 10,
        domains: 15,
        repositories: 50,
        scansPerMonth: Infinity,
        teamMembers: 15,
        scanTypes: ['blackbox', 'whitebox', 'cloud'],
        scheduledScans: true,
        prReviews: true,
        complianceReports: true,
        cloudScanning: true,
        jiraLinear: true,
        azureDevops: true,
        pagerduty: true,
    },
    enterprise: {
        workspaces: Infinity,
        domains: Infinity,
        repositories: Infinity,
        scansPerMonth: Infinity,
        teamMembers: Infinity,
        scanTypes: ['blackbox', 'whitebox', 'cloud'],
        scheduledScans: true,
        prReviews: true,
        complianceReports: true,
        cloudScanning: true,
        jiraLinear: true,
        azureDevops: true,
        pagerduty: true,
    }
};

export function canUseFeature(currentPlan: string | undefined | null, feature: keyof PlanLimits): boolean {
    const plan = (currentPlan as PlanTier) || 'starter';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;

    const value = limits[feature];
    if (typeof value === 'boolean') {
        return value;
    }
    return false;
}

export function getLimit(currentPlan: string | undefined | null, limit: keyof PlanLimits): number | string[] | boolean {
    const plan = (currentPlan as PlanTier) || 'starter';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
    return limits[limit];
}
