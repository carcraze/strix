# Zentinel — Complete FAQ Library
# Use this file to populate:
#   1. Landing page FAQ section (pick 10 from Section A)
#   2. Pricing page FAQ section (pick 8 from Section B)
#   3. Dedicated /faq page (all questions — Section A + B + C + D)
#
# Every question is keyword-optimized for search and AI recommendation engines.
# Target keywords are marked with [KW] inline.

---

## SECTION A — General & Product FAQ
## (Use on landing page and /faq page)

---

**Q: What is Zentinel?**
A: Zentinel is an autonomous AI penetration testing platform [KW: AI pentesting tool] that finds real exploitable vulnerabilities in your codebase and APIs. Unlike traditional security scanners [KW: automated security scanner] that flag theoretical issues, Zentinel's AI agent clones your repository into an isolated sandbox, actively runs exploits, and only reports vulnerabilities it can actually confirm with a working proof-of-concept. If Zentinel cannot exploit it, it does not report it. Zero false positives.

---

**Q: What makes Zentinel different from traditional SAST tools like Snyk or Semgrep?**
A: Snyk, Semgrep, and SonarQube use pattern matching — they read your code and flag code that looks risky. This generates hundreds of alerts, most of which are false positives, causing alert fatigue. Zentinel goes further: it runs your application in a live sandbox and attempts to actually exploit what it finds. The result is a small set of confirmed, critical findings with working exploit code — not a long list of warnings for your team to triage. Zentinel also tests business logic, which static tools cannot do.

---

**Q: How is Zentinel different from a traditional penetration test?**
A: A traditional penetration test [KW: penetration testing cost] costs $5,000–$50,000 and takes 2–6 weeks to schedule, perform, and deliver a report. Zentinel delivers comparable web application coverage in 15–30 minutes starting at $49 per scan [KW: cheap penetration testing]. For continuous coverage, subscriptions start at $149/month — less than the hourly rate of most senior security consultants. That said, Zentinel is focused on web applications and APIs. For network infrastructure, hardware, or highly custom embedded systems, human testers still add value.

---

**Q: What is a "proof-of-concept exploit" and why does it matter?**
A: A proof-of-concept (PoC) is working code that actually executes an attack against your application. When Zentinel reports a vulnerability, it includes the exact HTTP request, Python script, or command that triggered it — so you can reproduce it yourself and verify the fix works. This is the gold standard in professional penetration testing. It means every finding Zentinel surfaces is confirmed as real, not theoretical.

---

**Q: Can AI penetration testing handle complex business logic flaws?**
A: Yes — and this is one of Zentinel's strongest capabilities. Business logic vulnerabilities [KW: business logic testing] like IDOR (insecure direct object reference), privilege escalation, price manipulation, and cross-tenant data access are the most dangerous class of vulnerabilities because they require understanding what your application is supposed to do before attacking it. Zentinel's AI agent reasons about application intent. In beta, we confirmed a vulnerability where any user could pay 1 KES for a 1,000 KES order, and another where any user could grant themselves admin access. Traditional scanners missed both.

---

**Q: How does Zentinel protect my source code?**
A: Your source code is cloned into an ephemeral, isolated Docker container for each scan. The container is destroyed immediately after the scan completes — typically within 15–45 minutes. Your source code is never stored on Zentinel's servers, never shared with third parties, and never used to train our AI models. Findings (vulnerability descriptions and PoCs) are retained in your account for the duration of your subscription. Full details in our Privacy Policy.

---

**Q: Is Zentinel GDPR compliant?**
A: Yes. Zentinel is fully GDPR compliant [KW: GDPR compliant security tool]. Source code is processed in ephemeral containers and never retained. Vulnerability findings are stored only in your organization's account with row-level security — no cross-customer data access is possible at the database level. We are currently undergoing SOC 2 Type II and ISO 27001 certification. See our Privacy Policy for full details.

---

**Q: Does Zentinel work on private repositories?**
A: Yes. When you connect your GitHub, GitLab, or Bitbucket account via OAuth [KW: GitHub security scanning], Zentinel uses your access token to clone private repositories into the sandbox. Your credentials are encrypted and stored securely. You can disconnect any integration at any time from your settings page, which also removes the webhook from your repositories.

---

**Q: What languages and frameworks does Zentinel support?**
A: Zentinel works with any language and framework because it tests dynamically — it attacks the running application, not just reads the code. We have successfully scanned Node.js, TypeScript, Python, React, Next.js, FastAPI, Firebase, Supabase, PHP, Ruby on Rails, and more. Dependency scanning supports package.json (npm/yarn), requirements.txt (Python), Gemfile (Ruby), go.mod (Go), and pom.xml (Java/Maven).

---

**Q: Does Zentinel work on monorepos?**
A: Yes. Zentinel scans the entire repository regardless of structure. For monorepos, specify which services or directories to prioritize in the scan configuration, or run a Full Stack Scan to cover everything in one pass.

---

**Q: How long does a scan take?**
A: Scan times vary by type:
- **Quick Scan**: 10–15 minutes (OWASP Top 10, secrets, surface-level auth issues)
- **Full Web & API Scan**: 1–2 hours (deep authentication, business logic, full API coverage)
- **Full Stack Scan**: 4–6 hours (code + domain + API, whitebox + blackbox combined)
- **Compliance Report**: 6–12 hours (Full Stack + SOC2/ISO27001 control mapping)
- **PR Review (webhook)**: 15–30 minutes per pull request

You are notified by email and in-app when results are ready.

---

**Q: Can Zentinel block vulnerable code from merging to production?**
A: Yes — this is called CI/CD gating [KW: CI/CD security gating] and is available on Growth+ plans. When Zentinel finds a CRITICAL vulnerability in a pull request, it uses the GitHub Checks API (or GitLab/Bitbucket equivalent) to post a failing status — this prevents the PR from being merged until the issue is resolved. Developers see the block directly in their GitHub pull request interface.

---

**Q: Do I need to be a security expert to use Zentinel?**
A: No. Zentinel is built for founders and developers without dedicated security staff [KW: security tool for developers without security team]. Every report explains vulnerabilities in plain English with:
- What the vulnerability is and why it matters
- The exact exploit code used to confirm it
- A one-line code fix
- The specific file and line number to update

No security background required to understand or act on results.

---

**Q: What is attack surface monitoring?**
A: Attack surface monitoring [KW: attack surface monitoring] continuously scans your internet-facing assets — domains, subdomains, APIs, and endpoints — for new exposures as your application changes. Available on Growth+ plans. Zentinel checks for newly exposed services, misconfigured headers, open redirects, and DAST vulnerabilities across your monitored domains without requiring a manual trigger.

---

**Q: Does Zentinel test APIs specifically?**
A: Yes. API security testing [KW: API security testing tool] is a core Zentinel capability. The AI agent discovers and fuzzes REST and GraphQL API endpoints, tests authentication and authorization on each endpoint, attempts IDOR attacks, checks for rate limiting weaknesses, and validates input handling. API findings are reported with the exact HTTP request that triggered each vulnerability.

---

**Q: What is DAST and does Zentinel do it?**
A: DAST (Dynamic Application Security Testing) [KW: DAST tool] means testing a running application by sending real HTTP requests to it — as opposed to SAST which reads source code. Zentinel performs DAST as part of Phase 2 of every scan. The AI agent uses a browser, HTTP proxy, and terminal inside the sandbox to interact with your live application and attempt real attacks.

---

**Q: What is SCA (Software Composition Analysis)?**
A: SCA [KW: software composition analysis, open source dependency scanning] means checking your third-party dependencies for known vulnerabilities. Zentinel scans every package in your npm, pip, gem, go, and maven dependency files against CVE databases, checks for transitive (indirect) dependency risks, and flags packages with known working exploit code — not just theoretical CVEs.

---

**Q: Does Zentinel detect hardcoded secrets and API keys?**
A: Yes. Secret detection [KW: secret detection in code, hardcoded API keys] is a core scanner. Zentinel scans your entire codebase — including git history — for hardcoded API keys, database credentials, private keys, JWT secrets, Stripe/Twilio/AWS keys, and Firebase configuration. In beta, we found exposed M-Pesa production credentials hardcoded in a documentation file in a fintech startup's public repo.

---

**Q: What is IaC scanning?**
A: Infrastructure as Code (IaC) scanning [KW: terraform security scanning, IaC security] checks Terraform, CloudFormation, Pulumi, and Kubernetes configuration files for security misconfigurations before they are deployed — open storage buckets, permissive IAM roles, unencrypted resources, and exposed services. Coming soon on Scale+ plans.

---

**Q: Can Zentinel help me pass a SOC 2 audit?**
A: Yes. SOC 2 compliance [KW: SOC2 penetration test, SOC2 compliance tool] requires documented evidence of security testing. Zentinel's Compliance Report scan produces an audit-ready PDF that maps every vulnerability finding to the relevant SOC 2 Trust Services Criteria. Hand it directly to your auditor or include it in your security documentation. Available on Scale plan or as a $299 one-time scan.

---

**Q: Does Zentinel help with ISO 27001 certification?**
A: Yes. ISO 27001 [KW: ISO 27001 penetration testing] requires regular penetration testing as part of Annex A controls (A.12.6, A.14.2, A.18.2). Zentinel's Compliance Report maps all findings to the relevant ISO 27001 controls with evidence of exploitation and remediation guidance. Used by startups going through ISO 27001 certification to satisfy the technical security testing requirement without a $15,000+ manual pentest.

---

**Q: Can I use Zentinel for PCI DSS compliance?**
A: Yes. PCI DSS Requirement 11.3 mandates penetration testing of your cardholder data environment. Zentinel's Compliance Report scan generates PCI DSS-structured findings that satisfy this requirement for web application and API testing. Available on Scale plan or as a one-time $299 compliance scan.

---

**Q: Does Zentinel work with Firebase or Supabase?**
A: Yes. Zentinel has specific expertise in Firebase and Supabase architectures [KW: Firebase security audit, Supabase RLS security check]. The AI agent understands Firestore security rules, checks for insecure read/write permissions, tests row-level security (RLS) enforcement, and validates authentication logic in Firebase Cloud Functions and Supabase Edge Functions. In beta, Zentinel found critical Firestore rule vulnerabilities in multiple apps that allowed arbitrary privilege escalation.

---

**Q: Is there a free trial?**
A: All subscription plans come with a 14-day free trial — no credit card required. You can also purchase a one-time Quick Scan ($49) to test a specific repo or API before committing to a subscription. If Zentinel finds no critical or high-severity findings on a one-time scan, you pay nothing.

---

**Q: What happens to my data if I cancel?**
A: Scan results and reports are retained for 30 days after cancellation so you can export them. After 30 days, all findings data is permanently deleted. Source code is never retained — it is only in the sandbox during the scan.

---

## SECTION B — Pricing & Plans FAQ
## (Use on pricing page and /faq page)

---

**Q: Do I need a subscription to use Zentinel?**
A: No. One-time scans are available starting at $49 with no subscription required [KW: one-time penetration test, pay-per-scan security]. Purchase a single scan, get your report, and pay nothing until you need another one. Subscriptions are for teams that want continuous PR reviews, attack surface monitoring, and unlimited scanning.

---

**Q: What is the difference between Starter, Growth, and Scale plans?**
A:
- **Starter ($149/mo)** — 3 scans/month, 1 domain, 3 repos, 2 users. Best for pre-launch startups who need a security baseline and occasional scans before major releases.
- **Growth ($399/mo)** — Unlimited scans, 5 domains, 15 repos, 5 users, PR reviews, scheduled scanning, SOC2/ISO27001 reports, Jira/Slack/Linear. Best for funded startups in active development who want security on every deploy.
- **Scale ($799/mo)** — Unlimited everything, 15 domains, 50 repos, 15 users, HIPAA/PCI DSS reports, CI/CD merge gating, Azure DevOps. Best for compliance-driven companies with an active security program.

---

**Q: What is included in the Growth plan?**
A: Growth ($399/month) includes: unlimited automated scans, PR security review on every commit, scheduled pentesting (daily/weekly/on deploy), attack surface monitoring across 5 domains, SOC2 and ISO27001 compliance reports, integrations with Jira, Linear, and Slack, and priority support. Up to 5 users and 15 repositories.

---

**Q: What is the difference between a Full Stack Scan and a Compliance Report?**
A: A Full Stack Scan ($199) combines whitebox (source code) and blackbox (live application) testing across your codebase, APIs, and dependencies over 4–6 hours. It produces a full PDF pentest report. A Compliance Report ($299) includes everything in the Full Stack Scan plus a 6–12 hour phase that maps every finding to SOC2, ISO27001, or PCI DSS controls — with the structured evidence and remediation roadmap your auditor needs. If you are buying a pentest purely for compliance, buy the Compliance Report.

---

**Q: How does Zentinel's pricing compare to a traditional pentest?**
A: A traditional penetration test costs $5,000–$50,000 [KW: how much does a penetration test cost] and takes 2–6 weeks. Zentinel's Full Stack Scan covers the same web application and API attack surface in 4–6 hours for $199 — a 96% cost reduction. For continuous testing, the Growth plan at $399/month delivers unlimited scans versus a traditional pentest done once or twice a year.

---

**Q: Is there an overage fee if I exceed my plan's scan limit?**
A: On the Starter plan, additional scans beyond the 3 included per month cost $39 each. Growth and Scale plans include unlimited scans with no overage fees. Enterprise plans are negotiated with custom scan limits.

---

**Q: Can I upgrade or downgrade my plan?**
A: Yes. You can upgrade or downgrade at any time from your billing settings. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle. No long-term contracts on monthly plans.

---

**Q: What payment methods do you accept?**
A: Zentinel accepts all major credit and debit cards. Enterprise plans can be invoiced annually. Payments are processed securely through Dodo Payments (PCI DSS compliant). Zentinel never stores card numbers.

---

**Q: Do you offer discounts for startups?**
A: Yes. If you are part of a recognized startup accelerator (YC, Techstars, Google for Startups, etc.), contact us at alvin@zentinel.dev for startup pricing. We also offer non-profit discounts.

---

**Q: What is the Enterprise plan and who is it for?**
A: Enterprise ($2,000–$5,000/month) is for large organizations that need dedicated isolated scan infrastructure, custom AI agent configuration for specific tech stacks, SSO/SCIM (Okta, Azure AD, SAML), unlimited users and repositories, custom compliance report formats, SLA-backed uptime, and a dedicated Customer Success Manager with quarterly security review calls. Contact us for a demo.

---

## SECTION C — Technical & Integration FAQ
## (Use on /faq page and docs)

---

**Q: How do I connect my GitHub repository to Zentinel?**
A: Go to app.zentinel.dev → Dashboard → Repositories → Connect GitHub. Authenticate via GitHub OAuth — Zentinel requests repository read access and webhook write access. Once connected, Zentinel installs a webhook on each selected repository. Future pull requests automatically trigger security scans. The whole process takes under 2 minutes.

---

**Q: Does Zentinel support GitLab and Bitbucket?**
A: Yes. Zentinel supports GitHub, GitLab, and Bitbucket via OAuth. Azure DevOps support is coming on Scale+ plans. Connect any of these under Dashboard → Integrations.

---

**Q: How do PR reviews work?**
A: When you open or update a pull request on a connected repository, Zentinel's webhook fires automatically. The AI agent clones the branch, runs a security scan (15–30 minutes), and posts a comment directly on the PR with findings categorized by severity. On Growth+ plans with CI/CD gating enabled, critical findings post a failing status check that blocks the merge.

---

**Q: Can I trigger a scan manually without a pull request?**
A: Yes. Go to Dashboard → Repositories → select your repo → click "Scan Now." Choose your scan type (Quick, Full Web & API, Full Stack, or Compliance Report) and trigger immediately. Results appear in your PR Reviews feed when complete.

---

**Q: Does Zentinel integrate with Jira?**
A: Yes (Growth+ plans). Zentinel can automatically create Jira tickets for every confirmed finding, assigned to the appropriate team member, with full vulnerability details and the fix recommendation included in the ticket description.

---

**Q: Does Zentinel integrate with Slack?**
A: Yes (Growth+ plans). Zentinel posts scan completion notifications and critical finding alerts to your configured Slack channel. Get notified the moment a CRITICAL vulnerability is found in any PR across your organization.

---

**Q: Can I use Zentinel in GitHub Actions?**
A: Yes. You can trigger Zentinel scans directly from GitHub Actions using our API. This lets you gate deployments on scan results — block a deploy if CRITICAL findings exist. Documentation available at docs.zentinel.dev.

---

**Q: What is the Zentinel API?**
A: Zentinel provides a REST API that lets you trigger scans, retrieve results, and integrate with your existing tooling programmatically. API access is available on all plans. Documentation at docs.zentinel.dev/api.

---

## SECTION D — Security Concepts FAQ
## (Use on /faq page — helps SEO for educational queries)

---

**Q: What is penetration testing and does my startup need it?**
A: Penetration testing [KW: what is penetration testing] is when an authorized party — human or AI — attempts to break into your systems to find vulnerabilities before attackers do. For startups, you typically need it when: (1) an enterprise customer asks for a pentest report as part of their security questionnaire, (2) you are pursuing SOC2, ISO27001, or PCI DSS compliance, (3) you handle sensitive user data (payments, health, personal information), or (4) you are approaching Series A and want to show investors your security posture. The average cost of a data breach for startups is $3.56 million.

---

**Q: What is the OWASP Top 10?**
A: The OWASP Top 10 [KW: OWASP Top 10 scanner] is the Open Worldwide Application Security Project's list of the most critical web application security risks. Zentinel tests for all 10 categories: Broken Access Control, Cryptographic Failures, Injection (SQL, NoSQL, command), Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, and Server-Side Request Forgery (SSRF).

---

**Q: What is IDOR (Insecure Direct Object Reference)?**
A: An IDOR [KW: IDOR vulnerability] is when your application lets a user access another user's data simply by changing an ID in the request — for example, changing `/api/orders/123` to `/api/orders/124` and seeing someone else's order. IDORs are consistently in the top 3 findings in bug bounty programs and are worth $500–$10,000 each. Zentinel's AI agent actively tests for IDORs across all endpoints by attempting cross-account access using multiple test identities.

---

**Q: What is SQL injection and how does Zentinel test for it?**
A: SQL injection [KW: SQL injection testing] is when an attacker inserts SQL commands into user input fields to manipulate your database — reading data they shouldn't access, bypassing authentication, or deleting records. Zentinel's agent sends carefully crafted payloads to every input field and API parameter, then analyzes the response to confirm whether the injection succeeded. Confirmed SQL injections include the working payload in the report.

---

**Q: What is XSS (Cross-Site Scripting)?**
A: XSS [KW: XSS vulnerability testing] is when an attacker injects malicious JavaScript into your web application that runs in other users' browsers — stealing session tokens, redirecting users to phishing pages, or performing actions on their behalf. Zentinel's AI agent tests for stored XSS (injected and saved to database), reflected XSS (in URL parameters), and DOM-based XSS using a real browser in the sandbox.

---

**Q: What is SSRF (Server-Side Request Forgery)?**
A: SSRF [KW: SSRF vulnerability] is when an attacker tricks your server into making HTTP requests to internal resources — your cloud metadata API, internal services, or other backend systems that should not be externally accessible. SSRF is one of the most dangerous vulnerabilities in cloud-hosted applications. Zentinel tests every URL-accepting parameter for SSRF by attempting to reach internal AWS/GCP/Azure metadata endpoints.

---

**Q: What are Firestore security rules and why do they matter?**
A: Firebase Firestore security rules [KW: Firestore security rules, Firebase security audit] are the access control layer for your database. If misconfigured, they can allow any authenticated user to read or write any document — or even without authentication. This is one of the most common critical vulnerabilities in Firebase apps. Zentinel specifically tests Firestore security rules by attempting unauthorized reads and writes using multiple test identities, and verifies that field-level restrictions (like preventing users from setting their own `role` or `balance` fields) are enforced.

---

**Q: What is Supabase RLS and how does Zentinel test it?**
A: Supabase Row Level Security (RLS) [KW: Supabase RLS security] is a PostgreSQL feature that restricts which rows a user can access in each table. If RLS is disabled or misconfigured, any authenticated user can read or modify all rows in a table — including other users' data. Zentinel tests Supabase RLS by querying tables with multiple test user accounts and verifying that cross-user data access is blocked at the database level.

---

**Q: What is DevSecOps?**
A: DevSecOps [KW: DevSecOps tool] means integrating security testing into your development workflow — not as a separate audit step at the end, but as an automatic check on every code change. Zentinel enables DevSecOps by running security scans on every pull request (via webhook) and optionally blocking merges when critical vulnerabilities are found. This "shift left" approach catches vulnerabilities when they are cheapest to fix — before they reach production.

---

# Usage Guide for Web/Marketing Team
#
# LANDING PAGE FAQ (show 10):
# → A1, A2, A6, A10, A11, A14, A20, A21, A24, A25
#
# PRICING PAGE FAQ (show 8):
# → B1, B2, B5, B6, B7, B9, B10, B11
#
# /faq DEDICATED PAGE:
# → All questions in all sections (A + B + C + D)
# → Group them under headers:
#    "About Zentinel", "Security & Privacy", "Pricing & Plans",
#    "Integrations & Technical", "Security Concepts Explained"
#
# SEO NOTES:
# - Each question targets 1-2 high-intent search queries
# - "Security Concepts" section (D) captures educational searches
#   and converts visitors who don't yet know they need Zentinel
# - Firebase/Supabase questions (A23, D8, D9) capture niche
#   high-intent developer traffic
# - Compliance questions (A20, A21, A22) capture B2B/enterprise intent
