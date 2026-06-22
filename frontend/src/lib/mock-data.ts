// Mock data for development/demo purposes
export const mockPentests = [
    { id: "demo-1", name: "Demo Scan", status: "completed", type: "web_api", issues_count: 5, created_at: new Date().toISOString() },
];

export const mockIssues = [
    { id: "issue-1", title: "SQL Injection in /api/users", severity: "critical", status: "open", pentest_id: "demo-1", created_at: new Date().toISOString() },
    { id: "issue-2", title: "Exposed API keys in headers", severity: "high", status: "open", pentest_id: "demo-1", created_at: new Date().toISOString() },
];

export const mockDomains = [
    { id: "domain-1", domain: "example.com", status: "verified", created_at: new Date().toISOString() },
];
