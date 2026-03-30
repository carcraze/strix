"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = {
    question: string;
    answer: string;
    category?: string;
};

// ─── SECTION A — General & Product (10 shown on landing page) ───────────────
export const generalFaqs: FAQItem[] = [
    {
        question: "What is Zentinel?",
        answer: "Zentinel is an autonomous AI penetration testing platform that finds real exploitable vulnerabilities in your codebase and APIs. Unlike traditional security scanners that flag theoretical issues, Zentinel's AI agent clones your repository into an isolated sandbox, actively runs exploits, and only reports vulnerabilities it can actually confirm with a working proof-of-concept. If Zentinel cannot exploit it, it does not report it. Zero false positives.",
    },
    {
        question: "What makes Zentinel different from traditional SAST tools like Snyk or Semgrep?",
        answer: "Traditional SAST tools match code patterns against a database of known vulnerability signatures. They cannot actually run your code, so they generate thousands of false positives. Zentinel is an active AI agent that runs inside a live sandbox — it actually attempts authentication bypass, privilege escalation, injection attacks, and API manipulation. Every finding in your report is real, reproducible, and comes with a one-line fix.",
    },
    {
        question: "How does Zentinel protect my source code?",
        answer: "We are fully GDPR compliant. Your source code is cloned into an ephemeral, isolated Docker container created per scan and destroyed immediately after completion. Your code is never written to disk outside the sandbox, never stored in our database, and never used to train our AI models. We operate under a zero-retention policy for source code. We are currently pursuing SOC 2 Type II and ISO 27001 certification.",
    },
    {
        question: "Does Zentinel work on monorepos?",
        answer: "Yes. Zentinel handles monorepo structures natively. You can point a scan at the root of your monorepo and Zentinel will auto-detect service boundaries, scan each component independently (your API, frontend, infra, internal packages), and produce a unified consolidated report.",
    },
    {
        question: "How long does a scan take?",
        answer: "A typical full-stack scan completes in 15 to 30 minutes. Complex monorepos or large codebases can take up to 60 minutes. Quick Scans run 5-phase analysis in under 10 minutes. You get real-time progress updates and a notification when your report is ready.",
    },
    {
        question: "What is attack surface monitoring?",
        answer: "Attack surface monitoring is the continuous, automated process of tracking every public-facing entry point of your product — domains, subdomains, API endpoints, authentication flows, and cloud assets — watching for new exposure, misconfigurations, and drift from a known-good baseline. Zentinel monitors your attack surface 24/7 and alerts you the moment a new risk appears, without you having to trigger a scan manually.",
    },
    {
        question: "Can Zentinel help me pass a SOC 2 audit?",
        answer: "Yes. Every Zentinel scan produces an audit-ready penetration test report with validated findings, working proof-of-exploit details, and remediation guidance. The Compliance Report tier explicitly maps every finding to SOC 2 Trust Services Criteria (Security, Availability, Confidentiality). Most compliance auditors accept Zentinel's reports as evidence of your annual penetration testing control.",
    },
    {
        question: "Does Zentinel help with ISO 27001 certification?",
        answer: "Yes. The Compliance Report tier generates findings mapped to ISO 27001 Annex A controls, specifically A.12.6 (Technical Vulnerability Management) and A.14.2 (Security in Development). You receive a remediation roadmap organized by control, giving your certification auditor exactly what they need.",
    },
    {
        question: "Is there a free trial?",
        answer: "Yes. We offer a 7-day free trial on all subscription plans including Growth and Scale. No payment information is required to start. You can also run a one-time Quick Scan starting at $49 with no subscription required. Book a demo and we will walk you through the platform and set up your first scan live.",
    },
    {
        question: "What happens to my data if I cancel?",
        answer: "If you cancel your subscription, your scan reports, findings history, and configuration are retained in read-only mode for 60 days. After 60 days, all your data is permanently and irreversibly deleted from our systems. You can export your full report history to PDF or JSON at any time before or after cancellation.",
    },
    {
        question: "How much does penetration testing cost in 2026?",
        answer: "Traditional manual penetration testing costs $5,000 to $50,000 per engagement with 2-6 week turnaround times. Zentinel delivers equivalent coverage starting at $49 for a Quick Scan or $149/month for unlimited continuous pentesting. For most startups, Zentinel reduces security testing costs by 95% while providing faster, more frequent coverage.",
    },
    {
        question: "What is AI penetration testing?",
        answer: "AI penetration testing uses autonomous AI agents to simulate real hacker behavior — cloning your code, running exploits, testing APIs, and validating vulnerabilities in an isolated sandbox. Unlike traditional static analysis tools that pattern-match code, AI pentesting actively attempts to exploit your application just like a real attacker would. Zentinel's AI agent finds only real, exploitable vulnerabilities with working proof-of-concepts, eliminating false positives.",
    },
    {
        question: "Best penetration testing tools for startups in 2026?",
        answer: "Startups need affordable, automated, and continuous security testing. The best tools combine DAST (dynamic testing), SAST (static analysis), and SCA (dependency scanning) in one platform. Zentinel is the only AI-native pentesting platform purpose-built for fast-moving startups — unlimited scans, PR-level security reviews, and compliance reports starting at $149/month. Traditional tools like Burp Suite Pro require manual security expertise Zentinel replaces.",
    },
    {
        question: "Does my SaaS startup need penetration testing?",
        answer: "Yes. If you're selling to enterprise customers (Fortune 500, healthcare, finance, government), your sales cycle will require proof of annual penetration testing. It's also required by SOC 2 Type II (CC6.1 control), ISO 27001 (A.12.6), PCI DSS, HIPAA, and most cyber insurance policies. Without a pentest, you cannot win enterprise deals. Zentinel makes pentesting affordable and continuous for early-stage SaaS companies.",
    },
];

// ─── SECTION B — Pricing & Plans (8 shown on pricing page) ──────────────────
export const pricingFaqs: FAQItem[] = [
    {
        question: "Do I need a subscription to use Zentinel?",
        answer: "No. While subscriptions unlock the best value for continuous CI/CD scanning, you can run one-time on-demand scans with no subscription required. A Quick Scan starts at $49, a Full Stack Scan is $199, and a Compliance Report (SOC 2 / ISO 27001 mapped) is $299. Pay once, no account required.",
    },
    {
        question: "What is the difference between the Starter, Growth, and Scale plans?",
        answer: "Starter ($149/mo) covers 2 domains and 5 repos with unlimited scans — ideal for pre-seed startups shipping fast. Growth ($399/mo) is our most popular plan with 5 domains, 15 repos, and includes Compliance Reports, Slack/Jira integrations, and attack surface monitoring. Scale ($799/mo) supports 10 domains, 50 repos, custom scan schedules, and API access.",
    },
    {
        question: "What is the difference between a Full Stack Scan and a Compliance Report?",
        answer: "A Full Stack Scan ($199 one-time) performs a deep 4-6 hour analysis of your code, APIs, domains, and dependencies and produces a PDF pentest report. A Compliance Report ($299 one-time) includes everything in the Full Stack Scan but runs an additional 6-12 hours to explicitly map every finding to SOC 2 Trust Services Criteria or ISO 27001 Annex A controls — the exact format your auditor needs.",
    },
    {
        question: "How does Zentinel's pricing compare to a traditional penetration test?",
        answer: "A traditional manual pentest costs $5,000 to $50,000 per engagement and takes 2 to 6 weeks to schedule, execute, and deliver. Zentinel delivers equivalent web application security coverage in 15 to 30 minutes, starting at $49 per scan or $149/month for continuous scanning. For most startups, Zentinel replaces 3 to 5 tools simultaneously.",
    },
    {
        question: "Is there an overage fee if I exceed my plan's scan limit?",
        answer: "No. All subscription plans include unlimited scans within your plan's domain and repository limits. There are no per-scan overage fees. If you need to add more domains or repos, you can upgrade your plan or add them à la carte.",
    },
    {
        question: "Can I upgrade or downgrade my plan at any time?",
        answer: "Yes. You can upgrade your plan at any time and the difference is prorated immediately. Downgrades take effect at the start of your next billing cycle. There are no lock-in contracts on monthly plans. Annual plans are billed upfront at a 20% discount.",
    },
    {
        question: "Do you offer discounts for startups or early-stage companies?",
        answer: "Yes. We offer a startup discount for companies under 2 years old or with less than $1M ARR. Qualifying startups receive 30% off their first 6 months on any subscription plan. Contact us via our demo booking link to apply.",
    },
    {
        question: "What is the Enterprise plan and who is it for?",
        answer: "The Enterprise plan is for companies that need dedicated infrastructure, custom SLAs, white-label reporting, on-premise deployment options, SSO, and a dedicated security success manager. It is priced on an annual contract negotiated per company. This plan is designed for funded Series A+ startups, scale-ups, and mid-market companies with compliance mandates. Book a demo to discuss your requirements.",
    },
    {
        question: "Zentinel vs Snyk — which is better?",
        answer: "Snyk is a dependency scanner that flags known CVEs in your npm/pip packages but does not test your custom application code. Zentinel is a full autonomous pentesting platform that scans your code, APIs, authentication flows, and business logic for exploitable vulnerabilities. Most companies use Snyk for dependency management and Zentinel for application security testing. They solve different problems.",
    },
    {
        question: "Zentinel vs GitHub Advanced Security — which should I use?",
        answer: "GitHub Advanced Security includes CodeQL (SAST) and Dependabot (SCA) but does not perform dynamic application security testing (DAST). It cannot test running APIs, authentication bypass, privilege escalation, or IDOR vulnerabilities. Zentinel complements GitHub Advanced Security by providing autonomous DAST pentesting with working proof-of-concepts. Use both for comprehensive coverage.",
    },
];

// ─── SECTION C — Technical & Integration ────────────────────────────────────
export const technicalFaqs: FAQItem[] = [
    {
        question: "How do I connect my GitHub repository to Zentinel?",
        answer: "Connecting GitHub takes under 2 minutes. From your Zentinel dashboard, click 'Connect Repository,' authenticate with GitHub OAuth, and select the repos you want to scan. Zentinel installs a webhook that triggers an automatic security review on every pull request.",
        category: "Technical & Integration",
    },
    {
        question: "Does Zentinel support GitLab and Bitbucket?",
        answer: "Yes. Zentinel has native integrations for GitHub, GitLab, and Bitbucket. All three support PR review triggers, webhook-based automatic scanning, and branch protection rules that can block vulnerable code from merging to main.",
        category: "Technical & Integration",
    },
    {
        question: "How do PR reviews work?",
        answer: "When you open or update a pull request in a connected repository, Zentinel automatically scans only the changed code delta. This makes reviews fast — typically under 5 minutes. If a critical or high-severity vulnerability is found in the diff, Zentinel posts a comment with the finding summary, proof-of-concept, and one-line fix. You can configure branch protection to block the merge until all critical findings are resolved.",
        category: "Technical & Integration",
    },
    {
        question: "Can I trigger a scan manually without a pull request?",
        answer: "Yes. You can trigger an on-demand full scan of any connected repository directly from the Zentinel dashboard at any time. You can also schedule recurring scans — daily, weekly, or on a custom cron schedule — without needing to open a PR.",
        category: "Technical & Integration",
    },
    {
        question: "Does Zentinel integrate with Jira?",
        answer: "Yes. Zentinel can automatically create Jira tickets for every finding, pre-populated with the vulnerability title, severity, affected file and line, proof-of-concept, and remediation suggestion. Tickets are linked back to the scan report and auto-closed when the finding is resolved in a subsequent scan.",
        category: "Technical & Integration",
    },
    {
        question: "Does Zentinel integrate with Slack?",
        answer: "Yes. You can connect Zentinel to any Slack channel and receive instant notifications when a new scan completes, a critical vulnerability is found, or a high-severity issue is introduced in a PR. Notifications include a finding summary and a direct link to the full report.",
        category: "Technical & Integration",
    },
    {
        question: "Can I use Zentinel in GitHub Actions?",
        answer: "Yes. Zentinel provides an official GitHub Action you can add to your CI/CD pipeline. The action triggers a scan on every push or pull request and can be configured to fail the workflow on critical findings, preventing vulnerable code from deploying.",
        category: "Technical & Integration",
    },
    {
        question: "What is the Zentinel API?",
        answer: "The Zentinel REST API (available on Scale and Enterprise plans) allows you to programmatically trigger scans, retrieve findings, manage projects, and pull reports into your own internal tooling or SIEM. Full API documentation and client libraries are available in your dashboard after connecting your first repository.",
        category: "Technical & Integration",
    },
    {
        question: "How to implement DevSecOps in my CI/CD pipeline?",
        answer: "DevSecOps starts with automated security testing on every pull request before code reaches production. Step 1: Connect your GitHub/GitLab repo to Zentinel. Step 2: Enable PR review triggers so every code change is scanned. Step 3: Configure branch protection to block merges on critical findings. Step 4: Integrate Slack/Jira for instant security alerts. Zentinel handles the heavy lifting — no security expertise required.",
        category: "Technical & Integration",
    },
    {
        question: "What is the best way to scan a Next.js app for security vulnerabilities?",
        answer: "Next.js apps have unique attack surfaces: API routes, server actions, edge middleware, and client-side state management. Traditional SAST tools miss 80% of Next.js vulnerabilities because they don't understand the framework's routing and data flow. Zentinel has native Next.js detection — it automatically discovers all API routes, tests server actions for injection, validates middleware authorization, and checks React component security.",
        category: "Technical & Integration",
    },
];

// ─── SECTION D — Security Concepts (Education) ───────────────────────────────
export const securityConceptFaqs: FAQItem[] = [
    {
        question: "What is penetration testing and does my startup need it?",
        answer: "Penetration testing (pentesting) is a simulated, authorized cyberattack against your own systems to find exploitable vulnerabilities before real attackers do. For startups, pentesting is required by most enterprise procurement security questionnaires, SOC 2 Type II audits, ISO 27001 certification, PCI DSS compliance, and HIPAA technical safeguard assessments. If you are selling to enterprise customers or handling sensitive data, you need a pentest.",
        category: "Security Concepts",
    },
    {
        question: "What is the OWASP Top 10?",
        answer: "The OWASP Top 10 is the industry-standard list of the ten most critical web application security risks, maintained by the Open Web Application Security Project. The current list includes Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, and Server-Side Request Forgery. Zentinel tests for all OWASP Top 10 categories in every scan.",
        category: "Security Concepts",
    },
    {
        question: "What is IDOR (Insecure Direct Object Reference)?",
        answer: "IDOR is an access control vulnerability where an attacker manipulates an identifier (like a user ID, file ID, or order ID in a URL or API request) to access or modify data belonging to another user without authorization. For example, changing '/api/orders/1234' to '/api/orders/1235' and seeing someone else's order. IDOR vulnerabilities are extremely common in SaaS applications and are notoriously missed by traditional SAST scanners. Zentinel's AI agent actively tests every API endpoint for IDOR flaws.",
        category: "Security Concepts",
    },
    {
        question: "What is SQL injection and how does Zentinel test for it?",
        answer: "SQL injection is an attack where malicious SQL code is inserted into input fields to manipulate your database — potentially dumping all user records, bypassing authentication, or deleting data. Zentinel tests for SQL injection by actively sending crafted payloads into every detected input point and observing database responses. Every confirmed SQLi finding comes with a working exploit payload so you can reproduce and verify it.",
        category: "Security Concepts",
    },
    {
        question: "What is XSS (Cross-Site Scripting)?",
        answer: "Cross-Site Scripting (XSS) is a vulnerability where attackers inject malicious scripts into web pages viewed by other users — used to steal session tokens, capture keystrokes, redirect users, or perform actions on their behalf. Zentinel tests for Reflected XSS, Stored XSS, and DOM-based XSS across every parameter, form field, and user-controlled input in your application.",
        category: "Security Concepts",
    },
    {
        question: "What is SSRF (Server-Side Request Forgery)?",
        answer: "SSRF is a vulnerability that allows an attacker to cause the server to make HTTP requests to unintended locations — including internal services, cloud metadata APIs (like the AWS EC2 metadata endpoint at 169.254.169.254), or internal databases not accessible from the public internet. SSRF is one of the most dangerous vulnerabilities in cloud-native applications and is included in the OWASP Top 10. Zentinel actively probes for SSRF in every URL parameter, webhook endpoint, and file upload handler.",
        category: "Security Concepts",
    },
    {
        question: "What are Firestore security rules and why do they matter?",
        answer: "Firestore security rules are the access control layer for Google Firebase's Firestore database. Misconfigured rules are the number one cause of Firebase data breaches — a missing rule can expose your entire database to unauthenticated read or write access. Zentinel specifically tests your Firestore rules by simulating both authenticated and unauthenticated access patterns to find data exposure before attackers do.",
        category: "Security Concepts",
    },
    {
        question: "What is Supabase RLS and how does Zentinel test it?",
        answer: "Row Level Security (RLS) in Supabase (PostgreSQL) defines which rows a user can read, insert, update, or delete. Disabled or improperly configured RLS policies can expose all rows of a table to any authenticated — or even unauthenticated — user. Zentinel creates test users at different permission levels and verifies that your RLS policies correctly enforce tenant isolation, data partitioning, and access boundaries.",
        category: "Security Concepts",
    },
    {
        question: "What is DevSecOps?",
        answer: "DevSecOps is the practice of integrating security testing and controls directly into your software development and deployment pipeline — rather than treating security as a separate, end-of-cycle audit. The goal is to find and fix vulnerabilities when they are cheapest to remediate: before they reach production. Zentinel is purpose-built for DevSecOps: every PR gets a security review, every deployment is validated, and your security posture is monitored continuously.",
        category: "Security Concepts",
    },
    {
        question: "What is broken access control and how do I prevent it?",
        answer: "Broken access control is the #1 OWASP vulnerability. It occurs when users can access resources or perform actions they shouldn't have permission for — like viewing another user's data, accessing admin panels, or modifying other accounts. Prevention requires authorization checks on every API endpoint and database query. Zentinel tests for broken access control by creating test users at different permission levels and verifying your authorization logic actually works.",
        category: "Security Concepts",
    },
    {
        question: "What is the difference between SAST, DAST, and IAST?",
        answer: "SAST (Static Application Security Testing) scans source code without running it — fast but high false positives. DAST (Dynamic Application Security Testing) tests running applications like a real attacker — slower but finds real exploits. IAST (Interactive Application Security Testing) combines both by instrumenting your app during testing. Zentinel is an AI-powered DAST platform that delivers the accuracy of manual pentesting with the speed and automation of SAST.",
        category: "Security Concepts",
    },
];

// ─── ALL FAQs combined for /faq dedicated page ────────────────────────────────
export const allFaqs: FAQItem[] = [
    ...generalFaqs.map(f => ({ ...f, category: "General & Product" })),
    ...pricingFaqs.map(f => ({ ...f, category: "Pricing & Plans" })),
    ...technicalFaqs,
    ...securityConceptFaqs,
];

export function FAQAccordion({ items, title = "Frequently Asked Questions" }: { items: FAQItem[], title?: string }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-20 bg-[#070707] border-y border-[#161616]">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight mb-4">{title}</h2>
                    <p className="text-[#888888]">Everything you need to know about Zentinel and how it works.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    {items.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div 
                                key={index} 
                                className="bg-[#0c0c0c] border border-[#161616] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#2a2a2a]"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <span className="font-semibold text-white/90 text-base">{item.question}</span>
                                    <ChevronDown 
                                        className={`h-5 w-5 text-[#888888] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-white" : ""}`} 
                                    />
                                </button>
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[600px] opacity-100 pb-5" : "max-h-0 opacity-0"}`}
                                >
                                    <p className="text-[#888888] text-[15px] leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
