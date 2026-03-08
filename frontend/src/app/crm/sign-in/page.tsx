"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Mail, Lock, Chrome, Eye, EyeOff, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function CRMSignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert(error.message);
            } else {
                // Let the proxy or a specialized redirect handler take over
                window.location.href = "/crm";
            }
        } catch (err) {
            console.error("CRM Sign in error:", err);
            alert("An error occurred during sign in");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) {
                alert(error.message);
            } else {
                setMagicLinkSent(true);
                alert("Magic link sent! Check your email to sign in to the CRM.");
            }
        } catch (err) {
            console.error("Magic link error:", err);
            alert("An error occurred sending the magic link");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/crm`,
                }
            });

            if (error) {
                alert(error.message);
                setLoading(false);
            }
        } catch (err) {
            console.error("Google sign in error:", err);
            alert("An error occurred during Google sign in");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-body">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[var(--color-cyan)]/10 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBtLTM5LjUtNDBoNDBMMSAxem0wLTM5LjV2NDBtMzguNS00MHY0MExbMzkgNDB6IiBzdHJva2U9IiMxQTIzMzIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-[0.2] z-0 pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--color-cyan)] to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.3)] mb-4">
                        <ShieldAlert className="h-9 w-9 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold font-syne text-white tracking-widest uppercase">ZENTINEL<span className="text-[var(--color-cyan)]">.</span>CRM</h1>
                    <p className="text-[10px] font-mono text-[#666] mt-2 tracking-[0.3em] uppercase">Sales Operations Access</p>
                </div>

                {/* Sign In Card */}
                <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyan)]/5 rounded-full blur-3xl -mr-16 -mt-16" />

                    <div className="space-y-4 mb-8">
                        <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            variant="outline"
                            className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 h-12 rounded-2xl font-bold"
                        >
                            <Chrome className="h-4 w-4 mr-2" /> Google Auth
                        </Button>
                    </div>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-white/5"></div>
                        <span className="shrink-0 mx-4 text-[10px] font-mono text-[#444] uppercase tracking-widest">or email access</span>
                        <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-5 mt-4">
                        <div>
                            <Label htmlFor="email" className="text-[#666] text-[10px] font-mono mb-2 block tracking-widest uppercase">
                                Staff Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="sdr@zentinel.dev"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-12 bg-white/5 border border-white/10 text-white placeholder:text-white/10 h-12 rounded-2xl focus:border-[var(--color-cyan)]/50 focus:ring-0 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-[#666] text-[10px] font-mono mb-2 block tracking-widest uppercase">
                                Access Ticket
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-12 pr-12 bg-white/5 border border-white/10 text-white placeholder:text-white/10 h-12 rounded-2xl focus:border-[var(--color-cyan)]/50 focus:ring-0 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 gap-3 flex flex-col">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-12 rounded-2xl shadow-[0_4px_15px_rgba(0,212,255,0.2)] transition-all"
                            >
                                {loading ? "VALIDATING..." : "SIGN IN TO CRM"}
                            </Button>

                            <Button
                                type="button"
                                onClick={handleMagicLink}
                                disabled={loading || magicLinkSent}
                                variant="outline"
                                className="w-full bg-transparent border border-white/10 text-[#666] hover:bg-white/5 hover:text-white h-12 rounded-2xl transition-all"
                            >
                                <Send className="h-3.5 w-3.5 mr-2" />
                                {magicLinkSent ? "CHECK EMAIL" : "GET MAGIC LINK"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                            Authorized personnel only
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
