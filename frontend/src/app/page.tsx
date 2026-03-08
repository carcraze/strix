"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Activity, ArrowRight, Bell, Brain, Bug, CheckCircle2, ChevronRight, Clock, Cloud, Code, Database,
    Cpu, Crosshair, FileCode2, FileText, Fingerprint, GitBranch, GitPullRequest, Globe, Search,
    Lock, Mail, Play, RefreshCw, Settings, Shield, ShieldAlert, ShieldCheck, Sparkles, Star, TrendingUp, Unplug, Zap
} from "lucide-react";

/* ─── SECTION: Navbar ─── */
function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-4 bg-black/70 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-10">
                <Link href="/">
                    <img src="/logo.png" alt="Zentinel" className="h-6 w-auto" />
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</Link>
                    <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
                    <Link href="https://cal.com/alvin-zentinel/15min" target="_blank" className="text-sm text-white/50 hover:text-white transition-colors">Get a Demo</Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/sign-in" className="text-sm text-white/70 hover:text-white transition-colors">
                    Sign In
                </Link>
                <Link
                    href="/sign-up"
                    className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                >
                    Get Started
                </Link>
            </div>
        </header>
    );
}


/* ─── SECTION: Hero ─── */
function Hero() {
    const [domain, setDomain] = useState("");

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-12 overflow-hidden">
            {/* Blue radial glow */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-900/25 blur-[130px] rounded-full" />
            </div>

            {/* Urgency pill — no beta label */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-600/10 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Attackers don&apos;t wait. Neither should you.
            </div>

            {/* Heading */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-[1.02] tracking-tight text-white mb-6 max-w-5xl">
                Your next breach is{" "}
                <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                    already in your code.
                </span>
            </h1>

            <p className="text-xl text-white/45 max-w-lg mx-auto mb-10 leading-relaxed">
                Zentinel finds it, proves it, and fixes it —{" "}
                <span className="text-white/70 font-semibold">before anyone else does.</span>
            </p>

            {/* Domain Lead Capture */}
            <div className="w-full max-w-xl mx-auto mb-12 flex flex-col items-center gap-6">
                <div className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                    <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-1.5 shadow-2xl">
                        <div className="pl-4 flex items-center text-white/20">
                            <Globe className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter your domain (e.g. acme.com)"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/20 font-mono text-sm"
                        />
                        <Link
                            href={`/sign-up?domain=${domain}`}
                            className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] whitespace-nowrap"
                        >
                            Find My Vulnerabilities →
                        </Link>
                    </div>
                </div>

                <Link
                    href="/sign-up"
                    className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
                >
                    See a real report first
                </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-xs font-mono text-white/20 uppercase tracking-widest">
                <span>Trusted by 200+ startups</span>
                <span className="hidden sm:block w-px h-4 bg-white/10" />
                <span>Avg. 12 critical findings per app</span>
                <span className="hidden sm:block w-px h-4 bg-white/10" />
                <span>First results in &lt; 60s</span>
            </div>

            {/* Separator */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>
    );
}

/* ─── SECTION: Full Stack Platform ─── */
function FullStackPlatform() {
    return (
        <section id="features" className="relative px-6 py-12 max-w-6xl mx-auto">
            {/* Subtle dot grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            {/* Heading */}
            <div className="relative z-10 text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                    Your full-stack security <span className="text-white/60">platform</span>
                </h2>
                <p className="text-white/40 text-base max-w-xl mx-auto">
                    One platform to secure your code, APIs, web apps, infrastructure, and cloud.
                </p>
            </div>

            {/* 3-column grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.05] border border-white/[0.05] rounded-xl overflow-hidden">

                {/* Card 1 — APIs & Web Apps */}
                <div className="bg-black/20 p-8 flex flex-col gap-6 hover:bg-black/40 transition-colors group">
                    <div className="flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        APIs &amp; Web Apps
                    </div>
                    <div>
                        <h3 className="text-[22px] font-medium text-white/70 leading-snug tracking-tight">
                            Autonomous <span className="font-bold text-white">API &amp; web<br />app</span> testing.
                        </h3>
                    </div>
                    <p className="text-sm text-white/30 leading-relaxed flex-1">
                        Test REST APIs, GraphQL endpoints, and web applications for vulnerabilities — fully autonomous, zero manual config.
                    </p>
                    {/* Logos: REST / GraphQL / gRPC */}
                    <div className="flex items-center gap-4 mt-2 h-6">
                        <img src="/swagger.svg" alt="REST" className="h-full w-auto" />
                        <img src="/graphql.svg" alt="GraphQL" className="h-full w-auto" />
                        <img src="/grpc.svg" alt="gRPC" className="h-full w-auto" />
                    </div>
                </div>

                {/* Card 2 — Code & Pull Requests */}
                <div className="bg-black/20 p-8 flex flex-col gap-6 hover:bg-black/40 transition-colors group">
                    <div className="flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                        Code &amp; Pull Requests
                    </div>
                    <div>
                        <h3 className="text-[22px] font-medium text-white/70 leading-snug tracking-tight">
                            Secure code <span className="font-bold text-white">before it<br />ships.</span>
                        </h3>
                    </div>
                    <p className="text-sm text-white/30 leading-relaxed flex-1">
                        Analyze code and pull requests for security issues in your CI pipeline. Catch vulnerabilities at the source.
                    </p>
                    {/* Logos: GitHub / GitLab / Bitbucket */}
                    <div className="flex items-center gap-4 mt-2 h-6">
                        <img src="/github.svg" alt="GitHub" className="h-full w-auto" />
                        <img src="/gitlab.svg" alt="GitLab" className="h-full w-auto" />
                        <img src="/bitbucket.svg" alt="Bitbucket" className="h-full w-auto" />
                    </div>
                </div>

                {/* Card 3 — Infrastructure & Cloud */}
                <div className="bg-black/20 p-8 flex flex-col gap-6 hover:bg-black/40 transition-colors group">
                    <div className="flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                        </svg>
                        Infrastructure &amp; Cloud
                    </div>
                    <div>
                        <h3 className="text-[22px] font-medium text-white/70 leading-snug tracking-tight">
                            Scan your entire <span className="font-bold text-white">cloud<br />surface.</span>
                        </h3>
                    </div>
                    <p className="text-sm text-white/30 leading-relaxed flex-1">
                        Find misconfigurations and exposures across cloud environments and infrastructure before attackers do.
                    </p>
                    {/* Logos: AWS / GCP / Azure */}
                    <div className="flex items-center gap-4 mt-2 h-6">
                        <img src="/aws.svg" alt="AWS" className="h-full w-auto" />
                        <img src="/googlecloud.svg" alt="GCP" className="h-[90%] w-auto" />
                        <img src="/azure.svg" alt="Azure" className="h-full w-auto" />
                        <img src="/kubernetes.svg" alt="Kubernetes" className="h-full w-auto" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: Workflow Steps ─── */
function WorkflowSteps() {
    return (
        <section className="relative px-6 py-12 max-w-6xl mx-auto border-t border-white/[0.05]">
            <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-[2.75rem] font-bold text-white mb-4 tracking-tight">
                    From vulnerability to patch in seconds
                </h2>
                <p className="text-white/40 text-[17px] max-w-2xl mx-auto">
                    Discover critical exploits, automatically validate impact, and generate merge-ready pull requests.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.05] border-t border-b border-white/[0.05] -mx-6 px-6 sm:mx-0 sm:px-0">
                {/* Step 1 */}
                <div className="p-8 md:p-10 flex flex-col gap-5">
                    <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                        <Search className="h-4 w-4" />
                        Detect
                    </div>
                    <h3 className="text-[26px] font-medium text-white/70 leading-tight tracking-tight mt-2">
                        Pinpoint <span className="font-bold text-white">critical flaws</span><br />across your stack.
                    </h3>
                    <p className="text-[15px] text-white/30 leading-relaxed mt-2">
                        Continuously audits your entire attack surface. Filters out the noise so you only see vulnerabilities that matter.
                    </p>
                </div>

                {/* Step 2 */}
                <div className="p-8 md:p-10 flex flex-col gap-5">
                    <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        Validate
                    </div>
                    <h3 className="text-[26px] font-medium text-white/70 leading-tight tracking-tight mt-2">
                        <span className="font-bold text-white">Auto-validates</span> every<br />single alert.
                    </h3>
                    <p className="text-[15px] text-white/30 leading-relaxed mt-2">
                        Attempts to safely reproduce the exploit. Confirms actual risk with tangible proof, prioritizing true business impact.
                    </p>
                </div>

                {/* Step 3 */}
                <div className="p-8 md:p-10 flex flex-col gap-5">
                    <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                        <GitPullRequest className="h-4 w-4" />
                        Remediate
                    </div>
                    <h3 className="text-[26px] font-medium text-white/70 leading-tight tracking-tight mt-2">
                        <span className="font-bold text-white">One-click auto-patch.</span><br />Review, merge, secure.
                    </h3>
                    <p className="text-[15px] text-white/30 leading-relaxed mt-2">
                        Synthesizes a fix, re-tests to guarantee the flaw is resolved, and automatically raises a ready-to-merge PR.
                    </p>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: Unified Engine Graphic ─── */
function UnifiedEngine() {
    return (
        <section className="px-6 pb-16 max-w-6xl mx-auto">
            <div className="bg-[#050505] border border-white/5 rounded-2xl p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 overflow-hidden relative">

                {/* Visual Graphic Side */}
                <div className="relative flex-shrink-0 flex items-center justify-center w-full lg:w-auto mt-4 lg:mt-0">
                    <div className="flex items-center gap-6 relative z-10">
                        {/* Inputs */}
                        <div className="flex flex-col gap-3">
                            {[Code, Cloud, Globe, Database, Settings].map((Icon, idx) => (
                                <div key={idx} className="h-10 w-10 rounded-lg bg-[#0e111a] border border-white/10 flex items-center justify-center relative shadow-sm group">
                                    <Icon className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors" />
                                    {/* Connection line horizontal */}
                                    <div className="absolute right-[-1.5rem] top-1/2 h-px w-6 bg-white/10 transform -translate-y-1/2"></div>
                                </div>
                            ))}
                        </div>

                        {/* Central Engine */}
                        <div className="h-28 w-28 rounded-2xl bg-[#090b11] border border-white/10 flex items-center justify-center shadow-md relative z-20">
                            {/* Zentinel Logo inside the engine block */}
                            <img src="/logo.png" alt="Zentinel Engine" className="w-14 h-auto opacity-90" />
                            {/* Horizontal Lines out */}
                            <div className="absolute -right-8 top-1/2 w-8 h-px bg-gradient-to-r from-blue-500 to-transparent transform -translate-y-1/2"></div>
                            <div className="absolute -right-8 top-[30%] w-8 h-px bg-gradient-to-r from-red-500 to-transparent transform -translate-y-1/2 rotate-12 origin-left"></div>
                            <div className="absolute -right-8 top-[70%] w-8 h-px bg-gradient-to-r from-green-500 to-transparent transform -translate-y-1/2 -rotate-12 origin-left"></div>
                        </div>

                        {/* Outputs */}
                        <div className="flex flex-col gap-4 ml-6">
                            <div className="h-12 w-12 rounded-xl bg-[#0e111a] border border-red-500/20 flex items-center justify-center">
                                <Bug className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-[#0e111a] border border-blue-500/20 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-[#0e111a] border border-green-500/20 flex items-center justify-center">
                                <GitPullRequest className="h-5 w-5 text-green-400" />
                            </div>
                        </div>
                    </div>

                    {/* Faint connecting curves background */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        <path d="M 60 50 C 120 50, 150 140, 200 140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <path d="M 60 100 C 120 100, 150 140, 200 140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <path d="M 60 150 C 120 150, 150 140, 200 140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <path d="M 60 200 C 120 200, 150 140, 200 140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <path d="M 60 250 C 120 250, 150 140, 200 140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    </svg>
                </div>

                {/* Text Side */}
                <div className="flex-1 relative z-10 text-center lg:text-left">
                    <h3 className="text-[28px] md:text-3xl font-medium text-white/40 leading-snug tracking-tight">
                        <span className="font-bold text-white">Your entire stack, unified.</span> Code, cloud, microservices, and network infrastructure processed in — validated threats, exploit PoCs, and merge-ready patches out.
                    </h3>
                    <Link href="/sign-up" className="mt-8 bg-white hover:bg-gray-100 text-black px-6 py-2.5 rounded-md font-medium text-sm inline-flex items-center gap-2 transition-colors mx-auto lg:mx-0">
                        Try it now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: Workflow Integration ─── */
function WorkflowIntegration() {
    const items = [
        {
            tag: "Memory & Learning",
            icon: Brain,
            title: "Remembers every scan.",
            desc: "Zentinel builds on past findings, resolved issues, and historical context. Every test learns from the last, creating a persistent security memory of your stack."
        },
        {
            tag: "Context Awareness",
            icon: Fingerprint,
            title: "Deep ecosystem awareness.",
            desc: "Understands your specific tech stack and logic. Scans are tailored to your architecture, allowing us to find deep logical flaws that generic tools miss."
        },
        {
            tag: "Integrations",
            icon: Unplug,
            title: "Plugs into your workflow.",
            desc: "Native connections to GitHub, Slack, Jira, and your CI/CD pipeline. Findings flow directly into the tools your team already uses every day."
        }
    ];

    return (
        <section className="px-6 py-16 max-w-6xl mx-auto border-t border-white/5">
            <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                    Learns your stack. <span className="text-white/50">Fits your workflow.</span>
                </h2>
                <p className="text-white/40 text-lg max-w-2xl mx-auto">
                    Zentinel builds deep context of your unique architecture, remembering every scan to find flaws that generic scanners miss.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {items.map((item, i) => (
                    <div key={i} className="group bg-[#05080f] p-8 flex flex-col gap-6 hover:bg-[#080d18] transition-colors">
                        <div className="flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
                            <item.icon className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                            {item.tag}
                        </div>
                        <h3 className="text-2xl font-bold text-white leading-tight">
                            {item.title}
                        </h3>
                        <p className="text-sm text-white/40 leading-relaxed flex-1">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ─── SECTION: Continuous Monitoring ─── */
function ContinuousMonitoring() {
    return (
        <section className="px-6 py-16 max-w-6xl mx-auto border-t border-white/5">
            <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {/* Left Card: Always running */}
                <div className="bg-[#05080f] p-10 md:p-12 flex flex-col gap-8 hover:bg-[#080d18] transition-colors group">
                    <div className="flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
                        <RefreshCw className="h-4 w-4 group-hover:text-blue-400 transition-colors animate-[spin_4s_linear_infinite]" />
                        Continuous Monitoring
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-white mb-6">
                            Always running. <br />
                            <span className="text-white/50 group-hover:text-blue-400 transition-colors">Ship with confidence.</span>
                        </h3>
                        <p className="text-lg text-white/40 leading-relaxed max-w-md">
                            Autonomous pentesting that runs with every deploy. Get real-time alerts via Slack the moment a vulnerability is confirmed.
                        </p>
                    </div>
                    <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors group/link mt-4">
                        Set up monitoring <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Right Cards: Threat-Sync & Scheduling */}
                <div className="flex flex-col gap-px bg-white/5">
                    {/* Threat Sync */}
                    <div className="bg-[#05080f] p-10 flex flex-col gap-4 hover:bg-[#080d18] transition-colors group">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                Latest threats &amp; CVEs tested instantly.
                            </h3>
                        </div>
                        <p className="text-white/40 leading-relaxed">
                            New CVEs and global zero-days are automatically tested against your infrastructure the moment they drop.
                        </p>
                    </div>

                    {/* Scheduling */}
                    <div className="bg-[#05080f] p-10 flex flex-col gap-4 hover:bg-[#080d18] transition-colors group">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                Scan on every deploy, or your own schedule.
                            </h3>
                        </div>
                        <p className="text-white/40 leading-relaxed">
                            Integrate security into your CI/CD. Zentinel triggers automatically as you push to production or on a recurring cycle.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: Features Grid ─── */
const features = [
    { icon: ShieldCheck, title: "Zero False Positives", desc: "Every finding includes a verifiable Proof of Concept so you don't chase ghosts." },
    { icon: Crosshair, title: "Total Stack Coverage", desc: "Continuously scans APIs, web apps, cloud configurations, and source code." },
    { icon: Zap, title: "Elite Pentester Tactics", desc: "Autonomous AI that chains complex exploits to validate vulnerabilities instantly." },
    { icon: FileCode2, title: "Auto-Generated Patches", desc: "Get production-ready, tested code fixes delivered straight to your repository." },
    { icon: FileText, title: "Compliance on Autopilot", desc: "Instantly export audit-ready reports for SOC 2, ISO 27001, and PCI DSS." },
    { icon: GitBranch, title: "Native CI/CD Integration", desc: "Runs silently in the background of your existing development and deployment pipelines." },
];

function Features() {
    return (
        <section className="px-6 py-12 mt-4 border-t border-white/5 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
                {features.map((f, i) => (
                    <div key={i} className="group bg-[#05080f] p-8 flex flex-col gap-4 hover:bg-[#080d18] transition-colors">
                        <f.icon className="h-5 w-5 text-white/25 group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
                        <h3 className="text-base font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-blue-200 transition-all">
                            {f.title}
                        </h3>
                        <p className="text-sm text-white/35 leading-relaxed group-hover:text-white/50 transition-colors">{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ─── SECTION: Security Team ─── */
function SecurityTeam() {
    const items = [
        { icon: Cpu, title: "Fully Autonomous", desc: "AI agents that reason, adapt, and chain complex attacks from recon to exploitation." },
        { icon: TrendingUp, title: "Venture-Scale Security", desc: "Trusted by fast-growing startups to secure their path to Series A. We catch the critical flaws, so you can focus on the roadmap." },
        { icon: Star, title: "State of the Art", desc: "Top scores on industry benchmarks for detection. Finds what others miss." },
    ];

    return (
        <section className="px-6 py-16 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <p className="text-xs font-mono text-white/20 uppercase tracking-widest mb-4">The security team you didn&apos;t have to hire</p>
                <h2 className="text-4xl font-black text-white mb-4 max-w-lg">
                    Autonomous, validated, and production-ready security audits
                </h2>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    {items.map((item, i) => (
                        <div key={i} className="bg-[#080c18] p-8 hover:bg-[#0d1124] transition-colors">
                            <item.icon className="h-5 w-5 text-white/30 mb-4" strokeWidth={1.5} />
                            <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                            <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ─── SECTION: Final CTA ─── */
function FinalCTA() {
    return (
        <section className="relative px-6 py-24 border-t border-white/5 overflow-hidden">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
                    Built for <span className="text-blue-400">Founders</span> & <span className="text-white/40">Security Pioneers.</span>
                </h2>
                <p className="text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed">
                    The security team your startup needs, minus the overhead. Secure your entire perimeter in 60 seconds and go back to building.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/sign-up"
                        className="bg-white text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        Start for free →
                    </Link>
                    <Link
                        href="https://cal.com/alvin-zentinel/15min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/5 text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-white/10 border border-white/10 transition-all"
                    >
                        Book a demo
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: Footer ─── */
function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <img src="/logo.png" alt="Zentinel" className="h-6 w-auto opacity-90" />
                        </div>
                        <p className="text-sm text-white/30">Move Fast. Break Nothing.</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
                        <a href="mailto:hello@zentinel.dev" className="text-white/30 hover:text-white transition-colors">
                            <Mail className="h-5 w-5" />
                        </a>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/20">© 2026 Zentinel Inc. All rights reserved.</p>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        All systems operational
                    </div>
                </div>
            </div>
        </footer>
    );
}

/* ─── PAGE ─── */
export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <style>{`
                /* Ticker animation removed */
            `}</style>
            <Navbar />
            <div className="pt-[80px]">
                <Hero />
                <FullStackPlatform />
                <WorkflowSteps />
                <UnifiedEngine />
                <Features />
                <WorkflowIntegration />
                <ContinuousMonitoring />
                <SecurityTeam />
                <FinalCTA />
                <Footer />
            </div>
        </div>
    );
}
