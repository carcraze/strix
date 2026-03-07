import SignupFlow from "@/components/auth/SignupFlow";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-cyan)]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBtLTM5LjUtNDBoNDBMMSAxem0wLTM5LjV2NDBtMzguNS00MHY0MExbMzkgNDB6IiBzdHJva2U9IiMxQTIzMzIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-[0.15] z-0 pointer-events-none" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 flex justify-between items-center w-full mx-auto">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-blue-600 flex items-center justify-center shadow-[0_0_20px_var(--color-cyan)]/30 group-hover:shadow-[0_0_30px_var(--color-cyan)] transition-all">
                        <ShieldAlert className="h-5 w-5 text-black" />
                    </div>
                    <span className="text-xl font-bold font-syne text-white tracking-tight">Zentinel</span>
                </Link>
                <div className="text-sm font-mono text-[var(--color-textSecondary)]">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-[var(--color-cyan)] hover:opacity-80 font-bold ml-1">
                        Sign In
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative z-10 w-full py-12 px-4">
                <SignupFlow />
            </div>
        </div>
    );
}
