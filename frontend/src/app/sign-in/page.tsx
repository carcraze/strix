"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Mail, Lock, Chrome, Eye, EyeOff, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { detectSSO } from "@/lib/auth/detect-sso";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [signInMethod, setSignInMethod] = useState<'password' | 'magic-link'>('password');
    const [checkingSSO, setCheckingSSO] = useState(false);
    const [ssoUrl, setSsoUrl] = useState<string | null>(null);

    const handleEmailBlur = async () => {
        if (!email || !email.includes('@')) return;
        setCheckingSSO(true);
        try {
            const domain = email.split('@')[1];
            // Skip check for common free providers
            if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
                setSsoUrl(null);
                setCheckingSSO(false);
                return;
            }

            const result = await detectSSO(email);
            if (result.ssoEnabled && result.redirectUrl) {
                setSsoUrl(result.redirectUrl);
            } else {
                setSsoUrl(null);
            }
        } catch (e) {
            console.error("SSO detection error", e);
            setSsoUrl(null);
        } finally {
            setCheckingSSO(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert(error.message);
            } else {
                window.location.href = "/dashboard";
            }
        } catch (err) {
            console.error("Sign in error:", err);
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
                    emailRedirectTo: `${window.location.origin}/dashboard`
                }
            });

            if (error) {
                alert(error.message);
            } else {
                setMagicLinkSent(true);
                alert("Magic link sent! Check your email to sign in.");
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
                    redirectTo: `${window.location.origin}/auth/callback`,
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

    const handleForgotPassword = async () => {
        if (!email) {
            alert("Please enter your email address and click 'Forgot password?' again to reset it.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                alert(error.message);
            } else {
                alert("Password reset email sent!");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            alert("An error occurred sending reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[var(--color-cyan)]/10 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBtLTM5LjUtNDBoNDBMMSAxem0wLTM5LjV2NDBtMzguNS00MHY0MExbMzkgNDB6IiBzdHJva2U9IiMxQTIzMzIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-[0.15] z-0 pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-blue-600 flex items-center justify-center shadow-[0_0_20px_var(--color-cyan)]/30 group-hover:shadow-[0_0_30px_var(--color-cyan)] transition-all">
                            <ShieldAlert className="h-7 w-7 text-black" />
                        </div>
                        <h1 className="text-2xl font-bold font-syne text-white tracking-tight">Zentinel</h1>
                    </Link>
                </div>

                {/* Sign In Card */}
                <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold font-syne text-white mb-2">Welcome Back</h2>
                        <p className="text-sm font-mono text-[var(--color-textSecondary)]">Sign in to access your security dashboard</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading || checkingSSO}
                            variant="outline"
                            className="w-full bg-[var(--background)] border border-[var(--color-border)] text-white hover:bg-white/5 h-11"
                        >
                            <Chrome className="h-4 w-4 mr-2" /> Continue with Google
                        </Button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-[var(--color-border)]"></div>
                        <span className="shrink-0 mx-4 text-xs font-mono text-[var(--color-textMuted)]">OR</span>
                        <div className="flex-grow border-t border-[var(--color-border)]"></div>
                    </div>

                    {/* Email Sign In Form */}
                    <form onSubmit={handleEmailSignIn} className="space-y-4 mt-2">
                        <div>
                            <Label htmlFor="email" className="text-[var(--color-textSecondary)] text-xs font-mono mb-2 block">
                                WORK EMAIL
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    required
                                    className="pl-10 bg-[var(--background)] border border-[var(--color-border)] text-white placeholder:text-white/20 h-11 focus:border-[var(--color-cyan)]"
                                />
                                {checkingSSO && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="h-3 w-3 rounded-full border-2 border-[var(--color-cyan)] border-t-transparent animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!ssoUrl && (
                            <>
                                <div>
                                    <Label htmlFor="password" className="text-[var(--color-textSecondary)] text-xs font-mono mb-2 block">
                                        PASSWORD
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-textMuted)]" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required={!ssoUrl}
                                            className="pl-10 pr-10 bg-[var(--background)] border border-[var(--color-border)] text-white placeholder:text-white/20 h-11 focus:border-[var(--color-cyan)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)] hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs font-mono">
                                    <label className="flex items-center gap-2 text-[var(--color-textSecondary)] cursor-pointer">
                                        <input type="checkbox" className="rounded border-[var(--color-border)] bg-[var(--background)] text-[var(--color-cyan)] focus:ring-[var(--color-cyan)]" />
                                        Remember me
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[var(--color-cyan)] hover:opacity-80"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="space-y-3 pt-2">
                            {ssoUrl ? (
                                <Button
                                    type="button"
                                    onClick={() => window.location.href = ssoUrl}
                                    className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 transition-all"
                                >
                                    <Globe className="h-4 w-4 mr-2" /> Continue with SSO
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 transition-all"
                                    >
                                        {loading ? "Authenticating..." : "Sign In"}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleMagicLink}
                                        disabled={loading || magicLinkSent}
                                        variant="outline"
                                        className="w-full bg-transparent border border-[var(--color-border)] text-[var(--color-textSecondary)] hover:bg-white/5 hover:text-white h-11"
                                    >
                                        {magicLinkSent ? "Magic Link Sent!" : "Sign in with Magic Link"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </form>

                    <p className="text-center text-xs font-mono text-[var(--color-textSecondary)] mt-6">
                        Don't have an account?{" "}
                        <Link href="/sign-up" className="text-[var(--color-cyan)] hover:opacity-80 font-bold">
                            Request Access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

