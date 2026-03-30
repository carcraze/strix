import Link from "next/link";
import {
    ArrowRight, Bug, Code, Cloud, Database, FileCode2, FileText,
    GitBranch, Globe, Lock, Search, Shield, ShieldCheck, Zap, Package, Eye, Key, Bell
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const DEMO_URL = "https://cal.com/alvin-zentinel/15min";

const modules = [
    {
        num: "01",
        tag: "AI Pentest",
        accent: "#00E5FF",
        icon: Zap,
        title: "Autonomous AI Pentesting",
        tagline: "The future of pentesting. Delivered in hours, not months.",
        desc: `Zentinel's AI pentest engine deploys 200+ specialized agents that analyze your code and deployed APIs, simulate real attacker behavior — from recon to full exploitation — and deliver a verified, auditor-ready report.`,
        bullets: [
            "200+ AI agents simulate chained, multi-step exploit scenarios",
            "Outperforms human pentesters on benchmark vulnerability discovery",
            "SOC 2 and ISO 27001-ready report delivered in hours",
            "No High+ severity finding? Full money-back guarantee",
            "Covers web apps, APIs, internal services, and authentication flows",
        ],
        replaces: ["Manual Pentesting", "Cobalt.io", "XBOW"],
    },
    {
        num: "02",
        tag: "SAST",
        accent: "#00FF88",
        icon: Code,
        title: "Static Code Analysis (SAST)",
        tagline: "Fix vulnerabilities before they ever merge.",
        desc: `Scans your source code for security vulnerabilities including SQL injection, XSS, buffer overflows, path traversal, and hundreds of CVE patterns. Works out-of-the-box across all major languages with zero configuration.`,
        bullets: [
            "Supports Python, JavaScript, TypeScript, Go, Ruby, Java, PHP, and more",
            "Integrates directly into GitHub, GitLab, and Bitbucket PR workflows",
            "Catches issues at the source — before code reaches production",
            "AI AutoFix generates merge-ready patches for flagged issues",
            "Custom rules to match your team's coding standards and risk tolerance",
        ],
        replaces: ["Veracode", "Semgrep", "Checkmarx"],
    },
    {
        num: "03",
        tag: "DAST & APIs",
        accent: "#00E5FF",
        icon: Globe,
        title: "DAST & API Security",
        tagline: "Find what code review can't see.",
        desc: `Dynamically tests your live web apps and APIs by simulating real-world attacks — finding SQL injection, XSS, CSRF, and business logic flaws in your running application. Covers both surface-level and authenticated DAST flows.`,
        bullets: [
            "Authenticated DAST — tests behind login, session tokens, and OAuth",
            "Covers REST APIs, GraphQL, and stateful web application flows",
            "Nuclei-powered scanner for self-hosted apps and infrastructure",
            "Finds vulnerabilities that static analysis structurally cannot detect",
            "No traffic proxies or browser plugins required",
        ],
        replaces: ["StackHawk", "Intruder", "Burp Suite Pro"],
    },
    {
        num: "04",
        tag: "SCA",
        accent: "#c180ff",
        icon: Package,
        title: "Software Composition Analysis (SCA)",
        tagline: "Know every risk in every dependency.",
        desc: `Continuously monitors your third-party libraries, frameworks, and packages for known CVEs, license risks, and malicious supply chain attacks. Reachability analysis filters out false positives so you only fix what actually matters.`,
        bullets: [
            "Reachability analysis — only flags CVEs in code paths you actually execute",
            "Monitors npm, PyPI, Maven, NuGet, RubyGems, and Cargo ecosystems",
            "One-click AutoFix upgrades vulnerable dependencies automatically",
            "License compliance scanning — GPL, AGPL, and dual-license risk detection",
            "SBOM generation for compliance and customer security questionnaires",
        ],
        replaces: ["Snyk", "GitHub Advanced Security", "FOSSA"],
    },
    {
        num: "05",
        tag: "Containers",
        accent: "#c180ff",
        icon: Shield,
        title: "Container Image Scanning",
        tagline: "Secure what ships — not just what you wrote.",
        desc: `Scans your container OS and installed packages for known CVEs and security vulnerabilities. Highlights risks based on data sensitivity and auto-triages to remove noise, so your team focuses on what actually matters.`,
        bullets: [
            "Scans base images, OS packages, and installed runtimes",
            "Highlights vulnerabilities based on container workload data sensitivity",
            "Auto-triage cuts false positives by understanding your deployment context",
            "Integrates with Docker, ECR, GCR, and GitHub Container Registry",
            "Virtual machine scanning included for EC2 and other compute workloads",
        ],
        replaces: ["Snyk Container", "Docker Scout", "Trivy"],
    },
    {
        num: "06",
        tag: "IaC",
        accent: "#FFD60A",
        icon: FileCode2,
        title: "Infrastructure as Code (IaC) Scanning",
        tagline: "Catch misconfigs before they reach your cloud.",
        desc: `Scans your Terraform, CloudFormation, and Kubernetes Helm charts for misconfigurations, overly permissive policies, and security risks. Catches issues before they're ever committed to your default branch.`,
        bullets: [
            "Supports Terraform, CloudFormation, Kubernetes YAML, and Helm charts",
            "Detects open security groups, wildcard IAM policies, and hardcoded secrets",
            "CI/CD integration — fails builds on critical misconfigs before merge",
            "AI AutoFix generates corrected IaC blocks inline in your PR",
            "Maps findings to SOC 2, CIS, and HIPAA compliance frameworks",
        ],
        replaces: ["Bridgecrew", "Wiz Code", "Checkov"],
    },
    {
        num: "07",
        tag: "CSPM",
        accent: "#00E5FF",
        icon: Cloud,
        title: "Cloud Posture Management (CSPM)",
        tagline: "Your cloud attack surface — fully visible.",
        desc: `Detects cloud infrastructure risks across AWS, GCP, and Azure. Scans virtual machines, storage buckets, IAM roles, and network configurations for misconfigs and overly permissive access policies. Automates compliance policy enforcement.`,
        bullets: [
            "Covers AWS, Google Cloud Platform, Microsoft Azure, and Kubernetes",
            "Scans EC2 instances, S3 buckets, IAM roles, VPCs, and security groups",
            "Detects overly permissive access roles and public-facing resources",
            "Automated compliance checks for SOC 2, ISO 27001, CIS, and NIS2",
            "Continuous drift detection — alerts when your posture changes",
        ],
        replaces: ["Wiz", "Orca Security", "Prisma Cloud"],
    },
    {
        num: "08",
        tag: "Malware",
        accent: "#c180ff",
        icon: Bug,
        title: "Supply Chain Malware Detection",
        tagline: "Stop malicious packages before they execute.",
        desc: `The open-source ecosystem is a prime target for supply chain attacks. Zentinel identifies malicious code embedded in npm packages and JavaScript files — backdoors, trojans, keyloggers, XSS scripts, and cryptojacking code.`,
        bullets: [
            "Scans npm, PyPI, and popular package registries for embedded malware",
            "Detects backdoors, trojans, keyloggers, cryptojacking, and XSS payloads",
            "Behavioral heuristics catch novel threats beyond known signature databases",
            "Real-time monitoring — alerts the moment a malicious package is detected",
            "Powered by Zentinel's proprietary threat intelligence pipeline",
        ],
        replaces: ["Socket.dev", "Phylum", "Snyk"],
    },
    {
        num: "09",
        tag: "Secrets",
        accent: "#34b5fa",
        icon: Key,
        title: "Secrets Detection",
        tagline: "Find leaked credentials before attackers do.",
        desc: `Scans your code repositories, commit history, CI configs, and deployed environments for leaked API keys, passwords, certificates, and private encryption keys. No false-positive noise — only the secrets that matter.`,
        bullets: [
            "Scans current code, git history, and environment variable leaks",
            "Covers 200+ secret types: AWS keys, Stripe, GitHub tokens, JWT secrets",
            "Integrates into CI/CD — blocks commits containing sensitive credentials",
            "Smart filtering: never alerts on test data, placeholders, or safe patterns",
            "One-click rotation guidance for popular providers like AWS, GCP, and Twilio",
        ],
        replaces: ["GitGuardian", "TruffleHog", "Gitleaks"],
    },
    {
        num: "10",
        tag: "Integrations",
        accent: "#a3a6ff",
        icon: Bell,
        title: "Orchestrate & Integrate",
        tagline: "Security that fits your team's workflow.",
        desc: `Zentinel is API-first and built to integrate seamlessly with the tools your team already uses. Sync findings to Jira, route Slack alerts to the right engineers, and pipe data into your entire DevSecOps toolchain.`,
        bullets: [
            "Native Jira integration — auto-creates tickets with full finding context",
            "Slack alerts routed to the correct team or individual per project",
            "Email notifications with severity summaries and direct fix links",
            "Full REST API for custom dashboards, SIEM, and data pipelines",
            "Webhook support for any tool in your security or engineering stack",
        ],
        replaces: ["Manual Processes", "Fragmented Toolchains"],
    },
    {
        num: "11",
        tag: "AI Reports",
        accent: "#c180ff",
        icon: FileText,
        title: "AI Pentest Reports",
        tagline: "Compliance-ready security reports without the wait.",
        desc: `Our AI agents analyze your deployed apps, simulate attacker behavior, and deliver a fully verified report within hours. Not weeks. Not months. The report is structured to meet SOC 2 and ISO 27001 auditor requirements out of the box.`,
        bullets: [
            "Replaces expensive, slow manual penetration testing engagements",
            "SOC 2 Type II and ISO 27001 formatted — ready for auditor submission",
            "Includes verified PoCs, risk ratings, and remediation guidance",
            "Covers web applications, APIs, internal services, and auth flows",
            "Re-test included — confirm fixes are effective before the audit",
        ],
        replaces: ["Manual Pentesting", "Cobalt", "HackerOne"],
    },
];

export default function PlatformPage() {
    return (
        <div className="min-h-screen bg-[#000000] text-[#ffffff] antialiased">
            {/* Navbar */}
            <Navbar />
            <main className="pt-[72px]">
                {/* Hero */}
                <section className="relative px-6 py-28 text-center overflow-hidden bg-[#000000]">
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                    </div>
                    <div className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none"
                        style={{ backgroundImage: "radial-gradient(circle, #a3a6ff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                    <div className="max-w-4xl mx-auto">
                        <p className="text-xs font-mono text-[#888888] uppercase tracking-[0.2em] mb-6">All-in-one Security Platform</p>
                        <h1 className="text-5xl sm:text-[4.5rem] font-black text-white tracking-[-0.03em] leading-tight font-display mb-6">
                            An all-in-one Security Platform,<br />
                            <span className="text-[#888888]">Tailored to Startups.</span>
                        </h1>
                        <p className="text-[17px] text-[#888888] max-w-2xl mx-auto leading-relaxed mb-4">
                            The only platform you need to secure your product from code to cloud. Accelerate compliance. Easily prove to customers and investors you&apos;re secure.
                        </p>
                        <p className="text-[15px] text-white/80 font-semibold mb-10">
                            Trusted by 50+ startups · 500+ scans completed · Results in under 6 minutes
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/sign-up" className="inline-flex items-center gap-2 bg-[#00E5FF] hover:bg-[#2eeeff] text-black font-black px-12 py-5 rounded-full text-[16px] transition-all  shadow-[0_0_40px_rgba(0,229,255,0.2)]">
                                Start Your Free Pentest
                            </Link>
                            <Link href={DEMO_URL} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-12 py-5 rounded-full text-[16px] transition-all">
                                Book a Demo
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Modules */}
                <section className="bg-[#070707] px-6 py-24">
                    <div className="max-w-6xl mx-auto">
                        <p className="text-xs font-mono text-[#888888] uppercase tracking-[0.18em] mb-4">Features</p>
                        <h2 className="text-4xl font-black text-white font-display tracking-tight mb-14 max-w-xl">
                            These modules have you covered.<br />
                            <span className="text-[#888888]">Zero-in on real threats.</span>
                        </h2>

                        <div className="flex flex-col gap-8">
                            {modules.map((mod, idx) => (
                                <div
                                    key={mod.num}
                                    id={`module-${mod.num}`}
                                    className="group bg-[#0c0c0c] rounded-3xl p-8 md:p-12 border border-[#161616] hover:border-[#2a2a2a] transition-all hover:shadow-[0_24px_48px_rgba(0,0,0,0.3)] relative overflow-hidden"
                                >
                                    {/* Integration Visualization */}
                                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none hidden md:block">
                                        {mod.tag === "SAST" && <img src="/github.svg" className="absolute top-10 right-10 w-24 h-24" alt="" />}
                                        {mod.tag === "CSPM" && <img src="/aws.svg" className="absolute top-10 right-10 w-24 h-24" alt="" />}
                                        {mod.tag === "Containers" && <img src="/kubernetes.svg" className="absolute top-10 right-10 w-24 h-24" alt="" />}
                                        {mod.tag === "DAST & APIs" && <img src="/graphql.svg" className="absolute top-10 right-10 w-24 h-24" alt="" />}
                                    </div>

                                    <div className="grid md:grid-cols-5 gap-8 items-start relative z-10">
                                        {/* Left */}
                                        <div className="md:col-span-2 flex flex-col gap-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-mono text-[#888888] tracking-widest">{mod.num}</span>
                                                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                                                    style={{ color: mod.accent, backgroundColor: `${mod.accent}18` }}>
                                                    {mod.tag}
                                                </span>
                                            </div>
                                            <mod.icon className="h-6 w-6" style={{ color: mod.accent }} strokeWidth={1.5} />
                                            <h3 className="text-[26px] font-black text-white font-display leading-tight">{mod.title}</h3>
                                            <p className="text-[14px] font-semibold" style={{ color: mod.accent }}>{mod.tagline}</p>
                                            <p className="text-[14px] text-[#888888] leading-relaxed">{mod.desc}</p>
                                            {mod.replaces && (
                                                <div className="mt-2">
                                                    <p className="text-[11px] font-mono text-[#888888] uppercase tracking-wider mb-2">Replaces</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mod.replaces.map((r) => (
                                                            <span key={r} className="text-[11px] text-[#888888] bg-[#070707] px-2.5 py-1 rounded-md border border-[#161616] font-mono">{r}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right — bullet list */}
                                        <div className="md:col-span-3 flex flex-col gap-3">
                                            {mod.bullets.map((b) => (
                                                <div key={b} className="flex items-start gap-3 bg-[#070707] rounded-xl px-5 py-4 border border-[#161616] group-hover:border-white/5 transition-all">
                                                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border"
                                                        style={{ backgroundColor: `${mod.accent}15`, borderColor: `${mod.accent}40` }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mod.accent }} />
                                                    </span>
                                                    <span className="text-[14px] text-[#ffffff] leading-relaxed">{b}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative bg-[#000000] px-6 py-32 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none z-0">
                    </div>
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <h2 className="text-5xl sm:text-6xl font-black text-white mb-5 tracking-[-0.03em] font-display">
                            Get secure now.
                        </h2>
                        <p className="text-[17px] text-[#888888] mb-10 max-w-lg mx-auto leading-relaxed">
                            No consultants. No overhead. The only security platform built for how startups actually work — from code to cloud.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/sign-up" className="inline-flex items-center gap-2 bg-[#00E5FF] hover:bg-[#2eeeff] text-black font-bold px-10 py-4 rounded-full text-[16px] transition-all ">
                                Start for Free <span className="text-white/50 text-[13px] font-normal">No CC required</span>
                            </Link>
                            <Link href={DEMO_URL} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-[#2a2a2a] text-white font-semibold px-10 py-4 rounded-full text-[16px] transition-all">
                                Book a Demo
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />        </div>
    );
}
