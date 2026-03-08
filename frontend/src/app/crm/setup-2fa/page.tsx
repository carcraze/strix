"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ArrowRight, Copy, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

export default function CRMSetup2FA() {
    const router = useRouter();
    const [factorId, setFactorId] = useState<string>("");
    const [qrCode, setQrCode] = useState<string>("");
    const [secret, setSecret] = useState<string>("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const enrollmentAttempted = useRef(false);

    useEffect(() => {
        const setupMFA = async () => {
            if (enrollmentAttempted.current) return;
            enrollmentAttempted.current = true;
            setErrorMsg(null);

            // 1. List Factors
            const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

            if (listError) {
                console.error("List factors error:", listError);
                setErrorMsg("Failed to retrieve security factors.");
                return;
            }

            // 2. CHECK: If user already has a verified factor, they shouldn't be here
            if (factors.totp && factors.totp.length > 0) {
                const verifiedFactor = factors.totp.find(f => f.status === 'verified');
                if (verifiedFactor) {
                    console.log("Verified factor found, redirecting to verify page.");
                    router.replace("/crm/verify-2fa");
                    return;
                }
            }

            // 3. CLEANUP: Only clear UNVERIFIED factors to avoid "Multiple factors" errors 
            // but keep VERIFIED ones (though we handled verified above)
            if (factors.all && factors.all.length > 0) {
                for (const factor of factors.all) {
                    if (factor.status === 'unverified') {
                        console.log("Cleaning up unverified factor:", factor.id);
                        await supabase.auth.mfa.unenroll({ factorId: factor.id });
                    }
                }
            }

            // 4. Enroll fresh
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'Zentinel CRM',
                friendlyName: 'Zentinel Staff Device'
            });

            if (error) {
                console.error("MFA Enrollment error:", error);
                setErrorMsg(error.message);
                return;
            }

            const uri = data.totp?.uri;
            if (!uri) {
                console.error("No TOTP URI returned from enrollment");
                setErrorMsg("Security protocol failed: No URI returned.");
                return;
            }

            setFactorId(data.id);
            setQrCode(uri);
            setSecret(data.totp.secret);
        };

        setupMFA();
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6) return;

        setLoading(true);
        try {
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.id,
                code
            });

            if (verifyError) throw verifyError;

            // Success! 
            router.push("/crm");
        } catch (err: any) {
            alert(err.message || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-body">
            <div className="max-w-md w-full bg-[#050505] border border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-7 w-7 text-[var(--color-cyan)]" />
                    </div>
                    <h1 className="text-2xl font-bold font-syne text-white mb-2 uppercase tracking-tight">Activate CRM 2FA</h1>
                    <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Enhanced Identity Verification Required</p>
                </div>

                <div className="space-y-8">
                    {/* Step 1: Scan QR */}
                    <div className="flex flex-col items-center">
                        <div className="bg-white p-3 rounded-2xl mb-4 min-h-[180px] min-w-[180px] flex items-center justify-center">
                            {errorMsg ? (
                                <div className="flex flex-col items-center text-red-500 p-4">
                                    <AlertCircle className="h-8 w-8 mb-2" />
                                    <span className="text-[10px] uppercase font-mono text-center">{errorMsg}</span>
                                </div>
                            ) : qrCode ? (
                                <QRCodeSVG value={qrCode} size={180} level="L" includeMargin={false} />
                            ) : (
                                <div className="h-[180px] w-[180px] flex items-center justify-center bg-black/5 animate-pulse" />
                            )}
                        </div>
                        <p className="text-gray-400 text-sm text-center px-4 leading-relaxed">
                            Scan this code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                    </div>

                    {/* Manual Secret (Optional) */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Manual Secret</span>
                            <span className="text-xs font-mono text-gray-300 truncate">{secret || "Generating..."}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copySecret} className="shrink-0 text-gray-400 hover:text-white">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Step 2: Verify Code */}
                    <form onSubmit={handleVerify} className="space-y-4 pt-4 border-t border-white/5">
                        <div>
                            <label className="text-xs font-mono text-[#666] uppercase tracking-widest block mb-3 text-center">
                                Enter 6-digit verification code
                            </label>
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                className="bg-white/5 border-white/10 text-white text-center text-2xl h-16 rounded-2xl tracking-[0.5em] font-mono focus:border-[var(--color-cyan)]"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full h-12 rounded-2xl bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold text-sm shadow-[0_4px_15px_rgba(0,212,255,0.2)]"
                        >
                            {loading ? "VERIFYING..." : "ACTIVATE & CONTINUE"}
                            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest leading-loose">
                        Safety First: Keep your recovery codes safe.<br />Loss of access requires administrator override.
                    </p>
                </div>
            </div>
        </div>
    );
}
