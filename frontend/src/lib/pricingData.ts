// ─────────────────────────────────────────────
// DODO PAYMENTS — Product & Price IDs
// Replace prd_*** and price_*** with real IDs from your Dodo dashboard
// ─────────────────────────────────────────────
export const DODO_PRODUCTS = {
    starter: {
        productId: "pdt_0NZvY0MJ4wF2OeEnsaTXn", // This is technically just an identifier for our UI now, actual Dodo products are mapped below
        name: "Zentinel Starter",
        description: "Automated AI pentesting for indie hackers and early-stage startups. Includes 3 scans/month, 1 domain, 3 repositories, validated findings with proof-of-concept exploits, and one-click auto-fix PRs. The fastest way to know if your app is vulnerable.",
        prices: {
            monthly: { productId: "pdt_0NZvY0MJ4wF2OeEnsaTXn", amount: 149, interval: "month" },
            annual: { productId: "pdt_0NZvaroBDRirwX7Ks2jy6", amount: 119, interval: "month", billedAs: 1428 },
        },
    },
    growth: {
        productId: "pdt_0NZvZEvwRzDKT8i8vfL8d",
        name: "Zentinel Growth",
        description: "Unlimited autonomous pentesting for growing startups. Continuous attack surface monitoring, PR security reviews on every commit, scheduled scans, compliance reports (SOC2/ISO27001), and Jira/Linear/Slack integrations. Built for teams who ship fast without compromising security.",
        prices: {
            monthly: { productId: "pdt_0NZvZEvwRzDKT8i8vfL8d", amount: 399, interval: "month" },
            annual: { productId: "pdt_0NZvbbO7zfj2650NadGlU", amount: 319, interval: "month", billedAs: 3828 },
        },
    },
    scale: {
        productId: "pdt_0NZvaEWDFMzGj0C0GD1AG",
        name: "Zentinel Scale",
        description: "Enterprise-grade autonomous security for scaling companies. Everything in Growth plus real-time threat intelligence, attack path graphs, HIPAA/PCI DSS compliance, CI/CD hard gating to block vulnerable merges, Azure DevOps & Bitbucket integrations, and agent reasoning traces for full visibility.",
        prices: {
            monthly: { productId: "pdt_0NZvaEWDFMzGj0C0GD1AG", amount: 799, interval: "month" },
            annual: { productId: "pdt_0NZvcFFUadlxcJ86oeqbm", amount: 639, interval: "month", billedAs: 7668 },
        },
    },
    enterprise: {
        productId: "prd_zentinel_enterprise",
        name: "Zentinel Enterprise",
        description: "Custom autonomous security for large organizations. Dedicated isolated scan infrastructure, custom AI agent configuration for your stack, SSO & SCIM (Okta/Azure AD/SAML), custom compliance reports, SLA-backed uptime, and a dedicated Customer Success Manager. Everything unlimited, fully tailored.",
        prices: null,
    },
    // One-time scans
    quickScan: {
        productId: "pdt_0NZvMfJ8eFm1HyRw8utQ8",
        name: "Zentinel Quick Scan",
        description: "A fast blackbox security scan of one domain or API endpoint. Covers OWASP Top 10, delivers validated findings with proof-of-concept exploits, and produces a full PDF report — in under 30 minutes. No subscription required.",
        prices: {
            oneTime: { productId: "pdt_0NZvMfJ8eFm1HyRw8utQ8", amount: 49 },
        },
    },
    fullWebScan: {
        productId: "pdt_0NZvPO3EAz3DKXHlxwKW2",
        name: "Zentinel Full Web & API Scan",
        description: "Deep blackbox penetration test of your web application and API. Full OWASP coverage, authentication bypass testing, business logic flaws, and full API endpoint enumeration. Every finding includes a validated PoC and step-by-step reproduction guide.",
        prices: {
            oneTime: { productId: "pdt_0NZvPO3EAz3DKXHlxwKW2", amount: 99 },
        },
    },
    fullStackScan: {
        productId: "pdt_0NZvQoAV3whvNYvM76J54",
        name: "Zentinel Full Stack Scan",
        description: "The most comprehensive single-purchase security assessment. Combines whitebox code analysis with blackbox external testing across your domain, API, and source code. Covers hardcoded secrets, vulnerable dependencies, injection flaws, business logic, and infrastructure misconfigs. Full PDF report included.",
        prices: {
            oneTime: { productId: "pdt_0NZvQoAV3whvNYvM76J54", amount: 199 },
        },
    },
    complianceReport: {
        productId: "pdt_0NZvSLeuF1S1tLDpN3fmR",
        name: "Zentinel Compliance Report",
        description: "A Full Stack Scan plus a SOC2 or ISO27001 mapped compliance report. Audit-ready PDF that maps every finding to the relevant control, includes a prioritized remediation roadmap, and can be handed directly to your auditor or enterprise customer security team.",
        prices: {
            oneTime: { productId: "pdt_0NZvSLeuF1S1tLDpN3fmR", amount: 299 },
        },
    },
};

// ─────────────────────────────────────────────
// PLAN DATA
// ─────────────────────────────────────────────
export const plans = [
    {
        key: "starter",
        name: "Starter",
        tagline: "Essential security features for early-stage teams.",
        monthly: 149, annual: 119, annualTotal: 1428, annualSave: 360,
        wasMonthly: 199, wasAnnual: 149,
        monthlyProductId: "pdt_0NZvY0MJ4wF2OeEnsaTXn", annualProductId: "pdt_0NZvaroBDRirwX7Ks2jy6",
        highlight: false, badge: null, solid: false,
        cta: "Start free trial",
        scans: "3 scans/mo", overage: "$39/extra", domains: "1 domain", repos: "3 repos", users: "2 users",
        features: [
            "API & web app pentesting",
            "Validated findings with PoCs",
            "PR reviews on every commit",
            "One-click auto-fix PRs",
            "GitHub integration",
            "Email support",
        ],
        locked: [
            "Unlimited scans",
            "Attack surface monitoring",
            "Scheduled pentesting",
            "Compliance reports (SOC2/ISO27001)",
            "Jira, Linear & Slack",
        ],
    },
    {
        key: "growth",
        name: "Growth",
        tagline: "Unlimited scanning and continuous monitoring.",
        monthly: 399, annual: 319, annualTotal: 3828, annualSave: 960,
        wasMonthly: 499, wasAnnual: 399,
        monthlyProductId: "pdt_0NZvZEvwRzDKT8i8vfL8d", annualProductId: "pdt_0NZvbbO7zfj2650NadGlU",
        highlight: true, badge: "Most Popular", solid: true,
        cta: "Start free trial",
        scans: "Unlimited", overage: "—", domains: "5 domains", repos: "15 repos", users: "5 users",
        features: [
            "Everything in Starter",
            "Unlimited automated scans",
            "All scan types (API, Web, Code, Cloud)",
            "Attack surface monitoring",
            "PR reviews on every commit",
            "Scheduled pentesting (daily/weekly/on deploy)",
            "Jira, Linear & Slack integrations",
            "Compliance reports (SOC2 / ISO27001)",
            "Agent memory & learning across scans",
            "Priority support",
        ],
        locked: [
            "Real-time threat intelligence",
            "Attack path graphs",
            "CI/CD hard gating",
            "HIPAA / PCI DSS reports",
        ],
    },
    {
        key: "scale",
        name: "Scale",
        tagline: "For scaling companies with compliance mandates.",
        monthly: 799, annual: 639, annualTotal: 7668, annualSave: 1920,
        wasMonthly: 999, wasAnnual: 799,
        monthlyProductId: "pdt_0NZvaEWDFMzGj0C0GD1AG", annualProductId: "pdt_0NZvcFFUadlxcJ86oeqbm",
        highlight: false, badge: null, solid: false,
        cta: "Start free trial",
        scans: "Unlimited", overage: "—", domains: "15 domains", repos: "50 repos", users: "15 users",
        features: [
            "Everything in Growth",
            "Real-time threat intelligence",
            "Attack path graphs",
            "HIPAA & PCI DSS compliance reports",
            "CI/CD gating (block merges on criticals)",
            "Azure DevOps & Bitbucket integrations",
            "Agent Intel (reasoning traces, memory log)",
            "Dedicated Slack support channel",
        ],
        locked: [],
    },
    {
        key: "enterprise",
        name: "Enterprise",
        tagline: "For large orgs that need control and compliance.",
        monthly: null, annual: null, annualTotal: null, annualSave: null,
        wasMonthly: null, wasAnnual: null,
        monthlyProductId: null, annualProductId: null,
        highlight: false, badge: null, solid: false,
        cta: "Talk to sales",
        scans: "Unlimited", overage: "Negotiated", domains: "Unlimited", repos: "Unlimited", users: "Unlimited",
        features: [
            "Everything in Scale",
            "Dedicated isolated scan infrastructure",
            "Custom AI agent config for your stack",
            "SSO & SCIM (Okta / Azure AD / SAML)",
            "Custom compliance reports",
            "SLA-backed uptime guarantee",
            "Dedicated Customer Success Manager",
            "Quarterly security review calls",
            "Unlimited users",
        ],
        locked: [],
    },
];

export const oneTimeScans = [
    {
        key: "quickScan",
        name: "Quick Scan", price: 49, anchor: 500,
        productId: "pdt_0NZvMfJ8eFm1HyRw8utQ8",
        icon: "⚡", time: "~30 min", popular: false,
        desc: "Fast blackbox scan of 1 domain or API. OWASP Top 10, validated PoCs, PDF report.",
        includes: ["OWASP Top 10 coverage", "Validated PoCs", "PDF summary report"],
    },
    {
        key: "fullWebScan",
        name: "Full Web & API Scan", price: 99, anchor: 2000,
        productId: "pdt_0NZvPO3EAz3DKXHlxwKW2",
        icon: "🌐", time: "~2 hours", popular: false,
        desc: "Deep blackbox: auth testing, business logic, full API coverage. Every finding proven.",
        includes: ["Full OWASP + auth bypass", "Business logic testing", "Fix recommendations"],
    },
    {
        key: "fullStackScan",
        name: "Full Stack Scan", price: 199, anchor: 5000,
        productId: "pdt_0NZvQoAV3whvNYvM76J54",
        icon: "🔬", time: "~4 hours", popular: true,
        desc: "Code + domain + API. Whitebox & blackbox combined. Maximum coverage, one price.",
        includes: ["Code + domain + API", "Whitebox & blackbox", "Dependency scanning", "Full PDF report"],
    },
    {
        key: "complianceReport",
        name: "Compliance Report", price: 299, anchor: 15000,
        productId: "pdt_0NZvSLeuF1S1tLDpN3fmR",
        icon: "📋", time: "~6 hours", popular: false,
        desc: "Full Stack Scan + SOC2 or ISO27001 mapped report. Hand it straight to your auditor.",
        includes: ["Full Stack Scan included", "SOC2 or ISO27001 mapping", "Audit-ready PDF", "Remediation roadmap"],
    },
];
