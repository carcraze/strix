"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ArrowRight, Lock, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CRMVerify2FA() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [hostname, setHostname] = useState('secure-gate');

    useEffect(() => {
        // Fix hydration error: window only available client-side
        setHostname(window.location.hostname);

        const initMFA = async () => {
            const { data, error: listError } = await supabase.auth.mfa.listFactors();

            if (listError) {
                console.error("MFA Error:", listError);
                return;
            }

            const verifiedFactor = data.totp?.find(f => f.status === 'verified');

            if (!verifiedFactor) {
                console.warn("No verified TOTP factors found. Redirecting to setup.");
                router.push("/crm/setup-2fa");
                return;
            }

            setFactorId(verifiedFactor.id);
        };

        initMFA();
    }, [router]);

    const handleVerify = async (submittedCode: string) => {
        if (!submittedCode || submittedCode.length !== 6 || !factorId) return;
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            // Create challenge atomically right before verify (prevents IP mismatch 422)
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.id,
                code: submittedCode
            });

            if (verifyError) throw verifyError;

            // CRITICAL: Use full-page navigation, NOT router.push().
            // router.push() is client-side and doesn't re-send the updated AAL2 cookie
            // to the middleware, causing it to redirect back to verify-2fa silently.
            // window.location.href forces a fresh HTTP request with the new session.
            window.location.href = 'https://crm.zentinel.dev';
        } catch (err: any) {
            setError(err.message || "Invalid code. Check your authenticator app.");
            setCode("");
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 6);
        setCode(cleaned);
        setError(null);
        // Auto-submit when all 6 digits entered
        if (cleaned.length === 6) {
            handleVerify(cleaned);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/crm/sign-in");
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-body">
            <div className="max-w-md w-full bg-[#050505] border border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center mb-4">
                        <Lock className="h-7 w-7 text-[var(--color-cyan)]" />
                    </div>
                    <h1 className="text-2xl font-bold font-syne text-white mb-2 uppercase tracking-tight">Identity Verified</h1>
                    <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Enter authentication code to proceed</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleVerify(code); }} className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-center text-3xl h-20 rounded-2xl tracking-[0.5em] font-mono focus:border-[var(--color-cyan)] disabled:opacity-50"
                            autoFocus
                            disabled={loading || !factorId}
                        />
                        {error && <p className="text-red-400 text-xs font-mono text-center mt-3">{error}</p>}
                        {!factorId && !error && <p className="text-[#555] text-xs font-mono text-center mt-3">Loading...</p>}
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || code.length !== 6 || !factorId}
                        className="w-full h-14 rounded-2xl bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold text-base shadow-[0_4px_15px_rgba(0,212,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "VERIFYING..." : "UNLOCK CRM ACCESS"}
                        {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 text-[#444] hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Use different account
                    </button>
                </form>

                <div className="mt-10 text-center grayscale opacity-30">
                    <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-white mb-1">
                        <ShieldCheck className="h-3 w-3" /> SECURE LINK ESTABLISHED
                    </div>
                    <p className="text-[8px] font-mono text-white/50 uppercase tracking-[0.2em]">
                        Endpoint: {hostname}
                    </p>
                </div>
            </div>
        </div>
    );
}
