"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, Loader2 } from "lucide-react";

const CTO_UID = "03a2932b-4f96-4698-bab9-9e1829e2232a";

export default function CTOPanelLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== CTO_UID) {
                router.replace("/404");
                return;
            }
            setAuthorized(true);
            setLoading(false);
        };
        check();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-base tracking-tight">Zentinel CTO Panel</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">SUPER ADMIN</span>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
