"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Target, Users } from "lucide-react";

interface QualifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QualifyModal({ isOpen, onClose, onSuccess }: QualifyModalProps) {
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate qualification logic
        await new Promise(res => setTimeout(res, 1000));
        setSubmitting(false);
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <Target className="h-5 w-5 text-[var(--color-cyan)]" />
                        </div>
                        <h2 className="text-xl font-bold font-syne text-white">Qualify for Enterprise</h2>
                    </div>

                    <p className="text-sm text-[var(--color-textSecondary)] mb-8 font-mono">
                        Tell us about your organization to help us prepare for your tailored mission briefing.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[var(--color-textMuted)] uppercase">Team Size</label>
                                <select className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-cyan)] transition-colors">
                                    <option>1-50 employees</option>
                                    <option>51-200 employees</option>
                                    <option>201-1000 employees</option>
                                    <option>1000+ employees</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[var(--color-textMuted)] uppercase">Primary Goal</label>
                                <select className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-[var(--color-cyan)] transition-colors">
                                    <option>Continuous Compliance</option>
                                    <option>Secure Series A/B</option>
                                    <option>Replace Manual Audits</option>
                                    <option>Automate Red Teaming</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-white/10 text-white hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
