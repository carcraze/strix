"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Step1Identity } from "./steps/Step1Identity";
import { Step2Company } from "./steps/Step2Company";
import { Step3Stack } from "./steps/Step3Stack";
import { supabase } from "@/lib/supabase";
import { submitSignupData } from "@/lib/auth/signup";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

function SignupFlowInner() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [setupLoading, setSetupLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        companyName: "",
        companyWebsite: "",
        role: "",
        companySize: "",
        codePlatforms: [] as string[],
        concerns: [] as string[]
    });

    useEffect(() => {
        // Auto-fill email if they authenticated via OAuth first
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email) {
                setFormData(prev => ({ ...prev, email: session.user.email! }));
            }
        });

        // Auto-fill domain from landing page
        const domain = searchParams.get('domain');
        if (domain) {
            setFormData(prev => ({ ...prev, companyWebsite: domain }));
        }
    }, [searchParams]);

    const updateData = (newData: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const handleBack = () => {
        // Obsolete
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Step 3 fields
        if (formData.codePlatforms.length === 0 || formData.concerns.length === 0) {
            alert("Please select at least one option for each question.");
            return;
        }

        setSetupLoading(true);

        try {
            // 1. Create native Supabase Auth User (if they didn't SSO)
            let userId = "";

            // Check current session
            const { data: sessionData } = await supabase.auth.getSession();

            if (sessionData.session?.user) {
                // Logged in via SSO/Google, they're already in Auth.
                userId = sessionData.session.user.id;
            } else if (createdUserId) {
                // We already created the auth user in a previous failed submission of this step
                userId = createdUserId;
            } else {
                // Create new user with Email/Password
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            first_name: formData.firstName,
                            last_name: formData.lastName
                        },
                        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`
                    }
                });
                if (authError) {
                    if (authError.message.toLowerCase().includes("rate limit")) {
                        // They've requested too many emails. Their user likely exists.
                        setEmailSent(true);
                        setSetupLoading(false);
                        return;
                    }
                    throw authError;
                }
                if (!authData.user) throw new Error("No user created");
                userId = authData.user.id;
                setCreatedUserId(userId);
            }

            // 2. Save Onboarding details
            await submitSignupData(userId, {
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                company_name: formData.companyName,
                company_website: formData.companyWebsite,
                role: formData.role,
                company_size: formData.companySize,
                code_platforms: formData.codePlatforms,
                concerns: formData.concerns
            });

            // 3. Fake artificial delay for "AI Setup" feeling
            await new Promise(res => setTimeout(res, 1500));

            // 4. Check if confirmation email was sent
            // If email confirmation is required, there's no active session
            const { data: sessionDataCheck } = await supabase.auth.getSession();
            if (!sessionDataCheck.session) {
                setEmailSent(true);
                setSetupLoading(false);
                return;
            }

            // 5. Redirect based on tracking personalization logic
            let destination = "/dashboard";
            if (formData.concerns.includes("compliance")) destination = "/dashboard/compliance";
            else if (formData.concerns.includes("api_security")) destination = "/dashboard/surface";
            else if (formData.concerns.includes("cloud_misconfigs")) destination = "/dashboard/surface";
            else if (formData.concerns.includes("dependency_vulns")) destination = "/dashboard/issues";

            window.location.href = `https://app.zentinel.dev${destination}`;

        } catch (err: any) {
            console.error(err);
            alert(err.message || "An error occurred during onboarding.");
            setSetupLoading(false);
        }
    };

    // Check if sections are fully filled
    const isStep1Valid = formData.firstName && formData.lastName && formData.email && formData.password.length >= 8;
    const isStep2Valid = formData.companyName && formData.companyWebsite && formData.role && formData.companySize;
    const isFormValid = isStep1Valid && isStep2Valid && formData.codePlatforms.length > 0 && formData.concerns.length > 0;

    if (emailSent) {
        return (
            <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-10 flex flex-col items-center justify-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="rounded-full bg-green-500/20 p-4">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-syne font-bold text-white tracking-tight">Check Your Email</h3>
                <p className="text-sm font-mono text-[var(--color-textSecondary)] text-center leading-relaxed">
                    We've sent a confirmation link to <span className="text-white font-medium">{formData.email}</span>.
                    <br/><br/>
                    <span className="text-[var(--color-cyan)]">Clicking the link will sign you in automatically</span> and take you straight to your dashboard — no extra steps needed.
                </p>
                <p className="text-xs font-mono text-white/30 text-center">Can't find it? Check your spam folder.</p>
                <div className="pt-2">
                    <Button onClick={() => window.location.href="/sign-in"} variant="outline" className="bg-transparent border-[var(--color-border)] text-[var(--color-textSecondary)] hover:text-white hover:bg-white/5 font-bold">
                        Back to Sign In
                    </Button>
                </div>
            </div>
        );
    }

    if (setupLoading) {
        return (
            <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-10 flex flex-col items-center justify-center space-y-4 shadow-2xl animate-in fade-in duration-300">
                <Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" />
                <h3 className="text-lg font-syne font-bold text-white tracking-tight">Setting up your dashboard...</h3>
                <p className="text-sm font-mono text-[var(--color-textSecondary)] text-center">Configuring agents and preparing your environment</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden">
            <div className="p-8">
                <div className="mb-8 border-b border-[var(--color-border)] pb-6">
                    <h2 className="text-2xl font-bold font-syne text-white">Create your account</h2>
                    <p className="text-sm text-[var(--color-textSecondary)] mt-2">Get started with Zentinel in just a few seconds.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    
                    {/* Section 1: Identity */}
                    <div>
                        <h3 className="text-sm font-syne font-bold text-white mb-4 uppercase tracking-wider text-[var(--color-cyan)]">1. Your Details</h3>
                        <Step1Identity formData={formData} updateData={updateData} loading={loading} setLoading={setLoading} />
                    </div>

                    <div className="border-t border-[var(--color-border)]" />

                    {/* Section 2: Company */}
                    <div>
                        <h3 className="text-sm font-syne font-bold text-white mb-4 uppercase tracking-wider text-[var(--color-cyan)]">2. Company Context</h3>
                        <Step2Company formData={formData} updateData={updateData} />
                    </div>

                    <div className="border-t border-[var(--color-border)]" />

                    {/* Section 3: Stack */}
                    <div>
                        <h3 className="text-sm font-syne font-bold text-white mb-4 uppercase tracking-wider text-[var(--color-cyan)]">3. Stack & Intent</h3>
                        <Step3Stack formData={formData} updateData={updateData} />
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                        <Button
                            type="submit"
                            disabled={!isFormValid || setupLoading || loading}
                            className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-12 shadow-[0_0_15px_var(--color-cyan)]/20 transition-all group text-lg"
                        >
                            {setupLoading ? "Setting up..." : "Set Up My Dashboard"} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SignupFlow() {
    return (
        <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center"><Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" /></div>}>
            <SignupFlowInner />
        </Suspense>
    );
}
