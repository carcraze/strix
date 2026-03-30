"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Bug, CheckCircle2, ChevronRight, Clock, Cloud, Code, Database, FileCode2, FileText, GitBranch, GitPullRequest, Globe, Search, Lock, Mail, Play, RefreshCw, Shield, ShieldCheck, Zap, Key, Terminal, MousePointer2, ExternalLink, AlertTriangle, Server, FileCode, Users, TrendingUp, Sparkles, Target, Menu, X, FileSearch, Layers, Boxes, Settings, Eye, Workflow, Bot, Radar, Filter, Bell, Rocket, Container, Skull, Cpu, Scan, Fingerprint, AlertCircle, CheckCheck, MessageSquare, BookOpen, XCircle, Timer, ShieldAlert, Binary, Network, MemoryStick, CircleDot } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQAccordion, generalFaqs } from "@/components/FAQAccordion";
import { BackgroundEffects } from "@/components/BackgroundEffects";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";


const DEMO_URL = "https://cal.com/alvin-zentinel/15min";

const REPLACES_DATA = [
    { label: "Pentesting", items: ["Cobalt", "Synack", "Manual Testing"] },
    { label: "AppSec/SAST", items: ["Snyk", "GitHub AS", "Veracode"] },
    { label: "Cloud/CSPM", items: ["Wiz", "Orca", "Prisma Cloud"] },
    { label: "API Scanning", items: ["42Crunch", "Noname", "Salt Security"] }
];

// Platform Overview Section
function PlatformOverview() {
  return (
    <section className="py-20 relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-cyan-500/30 text-cyan-400 text-xs">PLATFORM</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            An all-in-one Security Platform,
            <br />
            <span className="text-zinc-400">Tailored to Startups</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            The only platform you need to secure your product from code to cloud. 
            Accelerate & automate compliance controls. Easily prove to your customers you&apos;re secure.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href={DEMO_URL}>
              <Button className="bg-white text-black hover:bg-zinc-200 px-5 h-11 text-sm font-medium">
                Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Trust Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Trusted by <span className="text-white font-medium">50+</span> startups and orgs
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              Completed <span className="text-white font-medium">500+</span> automated pentests
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Over <span className="text-white font-medium">$5M+</span> saved in testing costs
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// Platform Features Section - The main modules
function PlatformFeaturesSection() {
  const [activeTab, setActiveTab] = useState('available')
  
  type FeatureItem = { number: number, icon: any, title: string, description: string, tags: string[], comingSoon?: boolean };
  const availableFeatures: FeatureItem[] = [
    {
      number: 1,
      icon: FileSearch,
      title: "Static Code Analysis",
      description: "Scans your source code for security vulnerabilities such as SQL injection, XSS, buffer overflows and other security risks. Checks against popular CVE databases. Works out-of-the-box and supports all major languages.",
      tags: ["SAST", "All Languages", "CVE Database"]
    },
    {
      number: 2,
      icon: Globe,
      title: "DAST & API Security",
      description: "Monitor your App and APIs to find vulnerabilities like SQL injection, XSS, and CSRF—both on the surface and via authenticated DAST. Simulate real-world attacks and scan every API endpoint for common security threats.",
      tags: ["REST", "GraphQL", "Nuclei"]
    },
    {
      number: 3,
      icon: Layers,
      title: "Software Composition Analysis",
      description: "Analyse third-party components such as libraries, frameworks, and dependencies for vulnerabilities. Reachability analysis, triages to filter out false positives, and clear remediation advice. Auto-fix vulnerabilities with one click.",
      tags: ["SCA", "Auto-fix", "Reachability"]
    },
    {
      number: 4,
      icon: Container,
      title: "Container Security",
      description: "Scan your container operating system for packages with security issues. Checks if your containers have any vulnerabilities (Like CVEs). Highlights vulnerabilities based on container data sensitivity with auto-triaging.",
      tags: ["Docker", "K8s", "CVEs"]
    },
    {
      number: 5,
      icon: Server,
      title: "Infrastructure as Code (IaC)",
      description: "Scans Terraform, CloudFormation & Kubernetes Helm charts for misconfigurations. Detect issues that leave your infrastructure open to attack before they're committed to the default branch.",
      tags: ["Terraform", "CloudFormation", "Helm"]
    },
    {
      number: 6,
      icon: Cloud,
      title: "Cloud Security Posture",
      description: "Detect cloud infrastructure risks across major cloud providers. Scans Virtual Machines for vulnerabilities. Scan your cloud for misconfigurations and overly permissive user roles/access. Automate compliance checks.",
      tags: ["AWS", "GCP", "Azure"]
    },
    {
      number: 7,
      icon: Skull,
      title: "Malware Detection",
      description: "Identifies malicious code that may be embedded within JavaScript files or npm packages. Scans for backdoors, trojans, keyloggers, XSS, cryptojacking scripts and more.",
      tags: ["npm", "Supply Chain", "Malware"]
    },
    {
      number: 9,
      icon: Key,
      title: "Secrets Detection",
      description: "Check your code for leaked and exposed API keys, passwords, certificates, encryption keys. Scans your code & surfaces for the most risky secrets. Integrates directly into your CI/CD workflow.",
      tags: ["Secrets", "CI/CD", "Auto-detect"]
    },
    {
      number: 10,
      icon: Workflow,
      title: "Security Orchestration",
      description: "API-first integration with your project management tools, task managers, chat apps. Sync your security findings and status to Jira. Get chat alerts for new findings, routed to the correct team.",
      tags: ["Jira", "Slack", "API"]
    },
    {
      number: 14,
      icon: GitPullRequest,
      title: "Auto-Generated Patches",
      description: "Get production-ready, tested code fixes delivered straight to your repository. Synthesizes a fix, re-tests to guarantee the flaw is resolved, and raises a ready-to-merge PR automatically.",
      tags: ["Auto-fix", "PRs", "CI/CD"]
    },
    {
      number: 15,
      icon: ShieldCheck,
      title: "Compliance Automation",
      description: "Instantly export audit-ready reports for SOC 2, ISO 27001, HIPAA, and PCI DSS. Automate security policies & compliance checks. Continuous monitoring for audit readiness.",
      tags: ["SOC 2", "ISO 27001", "PCI DSS"]
    }
  ]
  
  const comingSoonFeatures: FeatureItem[] = [
    {
      number: 8,
      icon: Radar,
      title: "Runtime Protection",
      description: "Block zero-day vulnerabilities. Detects threats as your application runs and stops attacks in real-time, before they ever reach your database. Block users, bots, countries & restrict IP routes.",
      tags: ["WAF", "Real-time", "Blocking"],
      comingSoon: true
    },
    {
      number: 12,
      icon: Cpu,
      title: "Advanced Analytics",
      description: "Deep insights into your security posture over time. Track trends, measure team performance, and identify areas for improvement with comprehensive dashboards and reports.",
      tags: ["Analytics", "Reports", "Insights"],
      comingSoon: true
    },
    {
      number: 13,
      icon: FileCode,
      title: "Infrastructure as Code",
      description: "Scan your Terraform and CloudFormation configurations for misconfigurations and compliance violations before they are deployed.",
      tags: ["IaC", "Terraform", "Beta"],
      comingSoon: true
    },
    {
      number: 14,
      icon: Container,
      title: "Container Security",
      description: "Identify vulnerabilities, malware, and secrets in your container images continuously from build to runtime.",
      tags: ["Docker", "K8s", "Beta"],
      comingSoon: true
    },
    {
      number: 15,
      icon: Cloud,
      title: "Cloud Security Posture",
      description: "Continuously monitor your AWS, GCP, and Azure environments to automatically remediate massive security risks.",
      tags: ["CSPM", "Cloud", "Beta"],
      comingSoon: true
    }
  ]

  return (
    <section id="platform" className="py-20 relative bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 relative z-10 flex flex-col items-center">
          <Badge variant="outline" className="mb-6 border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs font-black px-4 py-1.5 bg-cyan-500/10 tracking-[0.2em] uppercase">
            Platform Capabilities
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
            Replace your entire testing stack. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Automate your security program.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            From code to cloud, Zentinel autonomously finds, validates, and patches zero-days—so your engineers can stop chasing false positives and get back to building.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'available' 
                ? 'bg-white text-black' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Available Now ({availableFeatures.length})
          </button>
          <button
            onClick={() => setActiveTab('coming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'coming' 
                ? 'bg-white text-black' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Coming Soon ({comingSoonFeatures.length})
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'available' ? availableFeatures : comingSoonFeatures).map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <Card 
                className={`h-full group relative bg-zinc-900/50 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 ${
                  feature.comingSoon ? 'opacity-90' : ''
                }`}
              >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-cyan-500/10 transition-colors">
                    <feature.icon className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        #{feature.number}
                      </span>
                      {feature.comingSoon && (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          IN BETA TESTING
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-white mt-1 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                  {feature.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag, j) => (
                    <span key={j} className="text-[11px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Learn More link removed */}
              </CardContent>
            </Card>
          </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Alerts Section - Only alerts that matter
function AlertsSection() {
  return (
    <section id="alerts" className="py-24 relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400 text-xs">SMART ALERTS</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Only get alerts
              <br />
              <span className="text-zinc-400">that matter to</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                you. your environment. your software.
              </span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-6">
              Security tools generate a lot of alerts. Only a few are worth acting on. 
              We run autonomous tests and only report if we find real, exploitable vulnerabilities.
            </p>
            
            {/* Key Points */}
            <div className="space-y-3">
              {[
                { icon: Filter, text: "Smart filtering eliminates 95% of noise" },
                { icon: CheckCheck, text: "Every alert is validated with proof" },
                { icon: Target, text: "Focus on what matters to YOUR stack" },
                { icon: Bell, text: "Real-time notifications via Slack/Jira" }
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <point.icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-zinc-300 text-sm">{point.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Visual */}
          <div className="relative">
            {/* Alert Card Stack */}
            <div className="relative space-y-3">
              {/* Filtered Out Alert */}
              <div className="relative bg-zinc-900/50 border border-white/5 rounded-xl p-4 opacity-40 transform -rotate-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">Filtered out</span>
                      <XCircle className="h-3 w-3 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-600 line-through">Potential XSS vulnerability in...</p>
                  </div>
                </div>
              </div>
              
              {/* Real Alert */}
              <div className="relative bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-xl p-4 shadow-lg shadow-red-500/5">
                <div className="absolute -top-2 -right-2">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    CRITICAL
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-red-400 font-medium">Validated & Exploitable</span>
                      <CheckCircle2 className="h-3 w-3 text-red-400" />
                    </div>
                    <p className="text-sm text-white font-medium">SQL Injection in /api/users endpoint</p>
                    <p className="text-xs text-zinc-500 mt-1">PoC generated • Patch available</p>
                  </div>
                </div>
              </div>
              
              {/* Another Filtered */}
              <div className="relative bg-zinc-900/50 border border-white/5 rounded-xl p-4 opacity-40 transform rotate-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">Filtered out</span>
                      <XCircle className="h-3 w-3 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-600 line-through">Outdated dependency found...</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCheck className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="text-xs text-zinc-400">Only <span className="text-white font-medium">real</span> vulnerabilities reported</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Why Zentinel Section
function WhyZentinelSection() {
  const benefits = [
    {
      icon: Zap,
      title: "Deploy in Minutes",
      description: "Connect your repo and cloud. Start scanning in under 5 minutes. No complex setup required."
    },
    {
      icon: Filter,
      title: "Zero False Positives",
      description: "Every finding includes a verifiable Proof of Concept. We validate before we alert."
    },
    {
      icon: GitPullRequest,
      title: "Auto-Fix & PRs",
      description: "Get production-ready code fixes delivered straight to your repository. Review, merge, done."
    },
    {
      icon: ShieldCheck,
      title: "Compliance Ready",
      description: "SOC 2, ISO 27001, HIPAA, PCI DSS. Export audit-ready reports instantly."
    }
  ]

  return (
    <section id="features" className="py-20 relative bg-zinc-950/50 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-cyan-500/30 text-cyan-400 text-xs">WHY ZENTINEL</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Security that works <span className="text-zinc-500">with</span> your team
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Built for developers, by developers. Security that fits your workflow, not the other way around.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="group p-6 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/20 hover:bg-zinc-900/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-cyan-500/10 flex items-center justify-center mb-4 transition-colors">
                <benefit.icon className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Integrations Section
function IntegrationsSection() {
  const integrations = [
    { name: "GitHub", src: "/github.svg" },
    { name: "GitLab", src: "/gitlab.svg" },
    { name: "Bitbucket", src: "/bitbucket.svg" },
    { name: "AWS", src: "/aws.svg" },
    { name: "GCP", src: "/googlecloud.svg" },
    { name: "Azure", src: "/azure.svg" },
    { name: "Slack", src: "/Slack.svg" },
    { name: "Jira", src: "/Jira.svg" },
    { name: "Kubernetes", src: "/kubernetes.svg" },
    { name: "Docker", src: "/Docker.svg" },
    { name: "Terraform", src: "/terraform-icon-svgrepo-com.svg" },
    { name: "Cloudflare", src: "/cloudflare-svgrepo-com.svg" },
    { name: "Datadog", src: "/datadog-svgrepo-com.svg" },
    { name: "PagerDuty", src: "/pagerduty-svgrepo-com.svg" },
    { name: "Opsgenie", src: "/opsgenie-svgrepo-com.svg" },
    { name: "Snyk", src: "/snyk-svgrepo-com.svg" },
    { name: "Dependabot", src: "/dependabot-svgrepo-com.svg" },
    { name: "Linear", src: "/linear-svgrepo-com.svg" },
    { name: "GraphQL", src: "/graphql.svg" },
    { name: "Swagger", src: "/swagger.svg" },
  ]

  // We duplicate the items a few times to ensure the marquee fills the screen and loops seamlessly
  const sliderItems = [...integrations, ...integrations, ...integrations];

  return (
    <section className="py-20 relative border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Integrates with your entire stack</p>
        </div>
        
        {/* Left/Right fading gradients to make it look like elements are sliding in/out of the void */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-48 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-48 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex">
          <motion.div
            className="flex gap-8 sm:gap-12 items-center pl-8 sm:pl-12"
            animate={{ x: ["0%", "-33.333333%"] }} // Slide exactly one full set of the 3 cloned sets
            transition={{
              ease: "linear",
              duration: 35, // 35 seconds per loop
              repeat: Infinity,
            }}
          >
            {sliderItems.map((int, i) => (
              <div key={i} className="group flex flex-col items-center gap-3 shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 group-hover:bg-zinc-800 transition-all duration-300">
                  <Image 
                    src={int.src} 
                    alt={int.name} 
                    width={32} 
                    height={32} 
                    className="w-7 h-7 sm:w-8 sm:h-8 opacity-60 group-hover:opacity-100 transition-all duration-300 drop-shadow-md grayscale group-hover:grayscale-0" 
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 group-hover:text-zinc-300 transition-colors">{int.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Zentinel found 3 critical vulnerabilities that our previous scanner missed for months. The PoC validation saved us countless hours.",
      author: "Sarah Chen",
      role: "CTO, TechFlow",
      initials: "SC"
    },
    {
      quote: "Finally, a security tool that developers actually want to use. The auto-generated patches are game-changing.",
      author: "Marcus Johnson",
      role: "Engineering Lead, Scaleup AI",
      initials: "MJ"
    },
    {
      quote: "We went from spending $50k/year on penetration testing to getting better coverage with Zentinel at a fraction of the cost.",
      author: "Emily Rodriguez",
      role: "VP Engineering, DataSync",
      initials: "ER"
    }
  ]

  return (
    <section className="py-20 relative bg-zinc-950/50 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
            Loved by security-conscious teams
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="h-full">
              <Card className="bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Sparkles key={j} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[11px] font-bold text-white">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{t.author}</div>
                      <div className="text-xs text-zinc-500">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
          <Rocket className="h-4 w-4 text-cyan-400" />
          <span className="text-cyan-400 text-xs font-medium">Start securing in under 5 minutes</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          Ready to find your next breach
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            before the attackers do?
          </span>
        </h2>
        
        <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
          Join 50+ startups who trust Zentinel to secure their code, APIs, and cloud infrastructure.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={DEMO_URL}>
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8 h-12 text-base font-medium">
              Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


export default function HomePage() {
    const [domain, setDomain] = useState("");

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 }
    };

    return (
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
            <Navbar />

            <main className="relative">
                {/* --- Hero Section --- */}
                <section className="relative px-6 py-32 md:py-48 flex flex-col items-center justify-center text-center overflow-hidden min-h-[90vh]">
                    <BackgroundEffects />

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-6xl mx-auto flex flex-col items-center z-10"
                    >
                        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00E5FF]" />
                            The Autonomous Security Engine
                        </div>

                        <h1 className="text-6xl sm:text-[90px] font-black leading-[0.95] tracking-tighter text-white mb-10 max-w-5xl">
                            Your next breach is <br />
                            <span className="text-on-surface-variant font-medium">already in your code.</span>
                        </h1>

                        <p className="text-xl sm:text-2xl font-medium text-on-surface/80 max-w-2xl mb-4 leading-relaxed">
                            Zentinel finds it, proves it, and fixes it — <span className="text-primary italic">on autopilot.</span>
                        </p>
                        
                        <p className="text-sm font-semibold tracking-wide text-zinc-500 uppercase mb-12">
                            Secure Everything. Compromise Nothing.
                        </p>

                        {/* Domain Lead Capture */}
                        <div className="w-full max-w-2xl mx-auto px-4">
                            <div className="relative group/input">
                                <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-purple/20 rounded-[2rem] blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex flex-col sm:flex-row items-center bg-[#070707]/90 backdrop-blur-3xl border border-white/10 rounded-[1.8rem] p-2 shadow-2xl">
                                    <div className="flex-1 flex items-center px-6">
                                        <Globe className="w-4 h-4 text-muted-foreground mr-3" />
                                        <input
                                            type="text"
                                            placeholder="Enter your product URL (e.g. acme.com)"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            className="w-full bg-transparent border-none outline-none py-4 text-white placeholder:text-muted-foreground font-mono text-sm focus:ring-0"
                                        />
                                    </div>
                                    <Link
                                        href={`/sign-up?domain=${domain}`}
                                        className="w-full sm:w-auto bg-primary hover:bg-primary-dim text-black font-black px-12 py-5 rounded-[1.4rem] text-[15px] transition-all whitespace-nowrap shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:scale-[1.02]"
                                    >
                                        Find My Vulnerabilities →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Hero Extension removed per user request */}
                    </motion.div>
                </section>

                
                <PlatformOverview />
                <PlatformFeaturesSection />
                <AlertsSection />
                <WhyZentinelSection />
                <IntegrationsSection />
                {/* <TestimonialsSection /> */}
                <FinalCTASection />

                <FAQAccordion items={generalFaqs} />
            </main>

            <Footer />
        </div>
    );
}
