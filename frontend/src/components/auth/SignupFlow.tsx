"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Step1Identity } from "./steps/Step1Identity";
import { Step2Company } from "./steps/Step2Company";
import { Step3Stack } from "./steps/Step3Stack";
import { supabase } from "@/lib/supabase";
import { submitSignupData } from "@/lib/auth/signup";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function SignupFlowInner() {
    const searchParams = useSearchParams();
    const initialStep = Number(searchParams.get('step')) || 1;
    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [setupLoading, setSetupLoading] = useState(false);

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

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
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
            } else {
                // Create new user with Email/Password
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            first_name: formData.firstName,
                            last_name: formData.lastName
                        }
                    }
                });
                if (authError) throw authError;
                if (!authData.user) throw new Error("No user created");
                userId = authData.user.id;
            }

            // 2. Save Onboarding details
            await submitSignupData(userId, {
                company_name: formData.companyName,
                company_website: formData.companyWebsite,
                role: formData.role,
                company_size: formData.companySize,
                code_platforms: formData.codePlatforms,
                concerns: formData.concerns
            });

            // 3. Fake artificial delay for "AI Setup" feeling
            await new Promise(res => setTimeout(res, 1500));

            // 4. Redirect based on tracking personalization logic
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

    // Check if current step is fully filled
    const isStep1Valid = formData.firstName && formData.lastName && formData.email && formData.password.length >= 8;
    const isStep2Valid = formData.companyName && formData.companyWebsite && formData.role && formData.companySize;

    if (setupLoading) {
        return (
            <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-10 flex flex-col items-center justify-center space-y-4 shadow-2xl animate-in fade-in duration-300">
                <Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" />
                <h3 className="text-lg font-syne font-bold text-white tracking-tight">Setting up your dashboard...</h3>
                <p className="text-sm font-mono text-[var(--color-textSecondary)] text-center">Configuring agents and preparing your environment</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0D1117] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 flex h-1 bg-[var(--background)]">
                <div className="h-full bg-[var(--color-cyan)] transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-mono text-[var(--color-cyan)] font-bold mb-1 block">STEP {step} OF 3</span>
                        <h2 className="text-xl font-bold font-syne text-white">
                            {step === 1 && "Create your account"}
                            {step === 2 && "Company context"}
                            {step === 3 && "Stack & intent"}
                        </h2>
                    </div>
                    {step > 1 && (
                        <button type="button" onClick={handleBack} className="h-8 w-8 rounded-full bg-[var(--background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-textMuted)] hover:text-white hover:border-white/20 transition-all">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <form onSubmit={step === 3 ? handleSubmit : handleNext}>
                    {step === 1 && <Step1Identity formData={formData} updateData={updateData} loading={loading} setLoading={setLoading} />}
                    {step === 2 && <Step2Company formData={formData} updateData={updateData} />}
                    {step === 3 && <Step3Stack formData={formData} updateData={updateData} />}

                    <div className="mt-8">
                        {step < 3 ? (
                            <Button
                                type="submit"
                                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                                className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 transition-all group"
                            >
                                Continue <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="w-full bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90 text-black font-bold h-11 shadow-[0_0_15px_var(--color-cyan)]/20 transition-all group"
                            >
                                Set Up My Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )}
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
