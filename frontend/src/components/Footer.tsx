"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-[#000000] border-t border-[#161616] px-6 pt-14 pb-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-3 group hover:opacity-90 transition-opacity">
                            <img src="/logo.png" alt="Zentinel Logo" className="h-6 w-auto object-contain" />
                        </div>
                        <p className="text-[12px] text-[#888888] font-mono mb-1">Move Fast. Break Nothing.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-4">
                        {[
                            { label: "Platform",  href: "/platform" },
                            { label: "Pricing",   href: "/pricing" },
                            { label: "Get a Demo",href: "https://cal.com/alvin-zentinel/15min", external: true },
                            { label: "Sign In",   href: "/sign-in" },
                            { label: "Get Started", href: "/sign-up" },
                        ].map((link) => (
                            <Link 
                                key={link.label} 
                                href={link.href} 
                                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="text-[13px] text-[#888888] hover:text-white transition-colors duration-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 text-[13px] text-[#888888]">
                        <p className="font-semibold text-white text-[13px] mb-1">Get in touch</p>
                        <a href="mailto:hi@zentinel.dev" className="flex items-center gap-2 hover:text-white transition-colors duration-300">
                            <Mail className="h-4 w-4" /> hi@zentinel.dev
                        </a>
                    </div>
                </div>
                <div className="border-t border-[#161616] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <p className="text-[11px] text-[#888888] font-mono">© 2026 Zentinel Inc. All rights reserved.</p>
                        <Link href="/terms"   className="text-[11px] text-[#888888] hover:text-white transition-colors">Terms</Link>
                        <Link href="/privacy" className="text-[11px] text-[#888888] hover:text-white transition-colors">Privacy</Link>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888] bg-[#070707] px-3 py-1.5 rounded-md border border-[#161616]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                        All systems operational
                    </div>
                </div>
            </div>
        </footer>
    );
}
