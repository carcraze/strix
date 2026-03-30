"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black py-16 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
                <div className="flex flex-col gap-6 max-w-sm">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 group-hover:scale-105 transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                            <img src="/logo.png" alt="Zentinel" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-sm font-black tracking-[0.2em] text-white uppercase group-hover:text-primary transition-colors">
                            Zentinel
                        </span>
                    </Link>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        The offensive security engine built for how startups actually work. From code to cloud, we've got you covered.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 md:gap-16">
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-40">Platform</h4>
                        <Link href="/platform" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">Features</Link>
                        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">Pricing</Link>
                        <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1 font-bold">Get Started</Link>
                    </div>
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-40">Resources</h4>
                        <Link href="/faq" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">FAQ</Link>
                        <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">For AI Agents</a>
                    </div>
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-40">Legal</h4>
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">Terms</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">Privacy</Link>
                    </div>
                    <div className="flex flex-col gap-5">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-40">Connect</h4>
                        <a href="mailto:hi@zentinel.dev" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-all hover:translate-x-1">
                            <Mail className="h-4 w-4" />
                            Contact Us
                        </a>
                    </div>
                </div>
            </div>
            
            {/* Bottom bar */}
            <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase opacity-20">
                    © {new Date().getFullYear()} Zentinel Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    {/* Systems Operational badge — always in sync with the top */}
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-secondary uppercase tracking-widest bg-secondary/5 px-3 py-1.5 rounded-full border border-secondary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#00FF88]" />
                        All Systems Operational
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-30 hidden sm:block">
                        Secure Everything. Compromise Nothing.
                    </p>
                </div>
            </div>
        </footer>
    );
}
