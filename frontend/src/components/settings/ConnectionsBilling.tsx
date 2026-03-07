"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Github, ExternalLink, CreditCard, Download, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import { BillingPricing } from "./BillingPricing";

interface Invoice {
    id: string;
    amount: number;
    plan_name: string;
    status: string;
    date: string;
    pdf_url: string;
}

export function ConnectionsBilling({ type }: { type: "billing" | "integrations" }) {
    const { activeWorkspace } = useWorkspace();
    const [currentPlan, setCurrentPlan] = useState("Starter");
    const [scansLeft, setScansLeft] = useState(1);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeWorkspace || type !== "billing") return;

        const loadBillingInfo = async () => {
            setLoading(true);
            try {
                // Fetch organization billing info
                const { data: orgData, error: orgError } = await supabase
                    .from("organizations")
                    .select("plan, scans_left")
                    .eq("id", activeWorkspace.id)
                    .single();

                if (orgError && orgError.code !== 'PGRST116') {
                    console.error("Error fetching billing info:", orgError);
                } else if (orgData) {
                    setCurrentPlan(orgData.plan || "Starter");
                    setScansLeft(orgData.scans_left ?? 1);
                }

                // Fetch invoices
                const { data: invData, error: invError } = await supabase
                    .from("invoices")
                    .select("*")
                    .eq("organization_id", activeWorkspace.id)
                    .order("date", { ascending: false });

                if (!invError && invData) {
                    setInvoices(invData);
                }
            } catch (err) {
                console.error("Error loading billing context", err);
            } finally {
                setLoading(false);
            }
        };

        loadBillingInfo();
    }, [activeWorkspace, type]);

    if (type === "billing") {
        const isBasic = currentPlan === "Starter" || currentPlan === "Basic";
        const isGrowth = currentPlan === "Growth" || currentPlan === "Pro";

        return (
            <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
                <div>
                    <h2 className="text-2xl font-syne font-bold text-white mb-2">Billing & Subscription</h2>
                    <p className="text-(--color-textSecondary) text-sm">Manage your Zentinel plan, scan usage, and invoices.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12 text-(--color-textMuted)">
                        <RefreshCw className="h-5 w-5 animate-spin mr-3" /> Loading billing details...
                    </div>
                ) : (
                    <>
                        {/* Current Plan Overview */}
                        <div className="border border-[var(--color-cyan)] bg-[var(--color-cyan)]/5 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyan)]/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />

                            <div className="flex justify-between items-start mb-6 relative">
                                <div>
                                    <div className="inline-flex items-center px-2 py-1 bg-[var(--color-cyan)]/20 text-[var(--color-cyan)] text-xs font-mono font-bold rounded mb-3 tracking-widest uppercase">
                                        Active Plan
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{currentPlan}</h3>
                                    <p className="text-sm text-(--color-textSecondary)">
                                        {isBasic ? "Essential pentesting features for early-stage teams." : "Unlimited scans, real-time threat intelligence, and auto-fixing PRs."}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-syne font-bold text-white mb-1">
                                        {scansLeft > 0 ? scansLeft : 0}
                                    </div>
                                    <p className="text-xs text-(--color-textMuted) uppercase tracking-wider font-mono">Scans Remaining</p>
                                </div>
                            </div>

                            {/* Warning if scans are low */}
                            {isBasic && scansLeft === 0 && (
                                <div className="mt-4 mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm flex items-start">
                                    <Zap className="h-4 w-4 mr-3 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong>You've run out of scans for this month.</strong>
                                        <p className="mt-1 opacity-80">Buy a one-time scan or upgrade to a Growth plan for unlimited scanning power.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 border-t border-(--color-border) pt-6">
                                <Button className="bg-background border border-(--color-border) text-white hover:bg-white/5">
                                    <CreditCard className="h-4 w-4 mr-2" /> Update Payment Method
                                </Button>
                            </div>
                        </div>

                        {/* Pricing & Upgrade Options */}
                        <BillingPricing />

                        {/* Invoices List */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Invoices & Receipts</h3>
                            {invoices.length === 0 ? (
                                <div className="border border-(--color-border) rounded-xl p-8 text-center bg-black/50">
                                    <p className="text-(--color-textMuted) text-sm">No invoices found for this organization.</p>
                                </div>
                            ) : (
                                <div className="border border-(--color-border) rounded-xl overflow-hidden bg-black/50">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-border/30 border-b border-(--color-border) text-(--color-textMuted)">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Date</th>
                                                <th className="px-4 py-3 font-medium">Description</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                <th className="px-4 py-3 font-medium text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border)]">
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-white/[0.02]">
                                                    <td className="px-4 py-3 text-(--color-textSecondary)">
                                                        {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-white font-medium">
                                                        {inv.plan_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-[#00FF88]/10 text-[#00FF88]' :
                                                            inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-white">
                                                        ${(inv.amount / 100).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-(--color-textMuted) hover:text-white">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Integrations View
    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-2xl font-syne font-bold text-white mb-2">Integrations</h2>
                <p className="text-(--color-textSecondary) text-sm">Connect Zentinel to your version control and cloud providers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub */}
                <div className="border border-(--color-border) bg-[var(--background)] rounded-xl p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                            <Github className="h-6 w-6 text-black" />
                        </div>
                        <span className="inline-flex items-center px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono font-medium rounded">
                            CONNECTED
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">GitHub</h3>
                    <p className="text-xs text-(--color-textSecondary) mb-6 flex-1">
                        Automatically scan PRs, track dependencies, and create auto-fix pull requests.
                    </p>
                    <Button variant="outline" className="w-full border-(--color-border) text-white hover:bg-white/5">
                        Manage Configuration <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                </div>

                {/* GitLab */}
                <div className="border border-(--color-border) bg-[var(--background)] rounded-xl p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 bg-[#FC6D26] rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 015.1 2h.02a.43.43 0 01.4.28l2.44 7.51h8.08l2.44-7.51A.43.43 0 0118.88 2h.02a.42.42 0 01.4.28l2.44 7.51 1.22 3.78a.84.84 0 01-.31.94z" /></svg>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 bg-[var(--color-border)] text-(--color-textMuted) border border-(--color-border) text-xs font-mono font-medium rounded">
                            NOT CONNECTED
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">GitLab</h3>
                    <p className="text-xs text-(--color-textSecondary) mb-6 flex-1">
                        Connect your GitLab repositories for seamless SAST and DAST integration.
                    </p>
                    <Button className="w-full bg-white text-black hover:bg-gray-200">
                        Connect
                    </Button>
                </div>
            </div>
        </div>
    );
}
