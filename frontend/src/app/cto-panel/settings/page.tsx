"use client";

import { Settings, Shield, Zap, Globe, Terminal } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">CTO panel configuration.</p>
            </div>

            <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap className="h-5 w-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Scan Defaults</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Default Scan Mode</span>
                            <span className="text-white font-medium">Deep</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Katana Headless</span>
                            <span className="text-green-400 font-medium">Enabled</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Katana Depth</span>
                            <span className="text-white font-medium">5</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Crawl Duration</span>
                            <span className="text-white font-medium">10 minutes</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">All Specialists</span>
                            <span className="text-green-400 font-medium">Enabled</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white">Access</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">CTO User</span>
                            <span className="text-white font-medium font-mono text-xs">alvinmugethi@gmail.com</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Auth Method</span>
                            <span className="text-white font-medium">UID Hardcoded</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Rate Limits</span>
                            <span className="text-red-400 font-medium">None (bypassed)</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0e] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Terminal className="h-5 w-5 text-green-400" />
                        <h3 className="text-sm font-semibold text-white">Infrastructure</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Backend</span>
                            <span className="text-white font-medium text-xs font-mono">zentinel-api (Cloud Run)</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Worker</span>
                            <span className="text-white font-medium text-xs font-mono">zentinel-worker-1 (VM)</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                            <span className="text-gray-400">Katana</span>
                            <span className="text-white font-medium text-xs font-mono">projectdiscovery/katana:latest</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Strix Engine</span>
                            <span className="text-white font-medium text-xs font-mono">strix-agent v1.0.4</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
