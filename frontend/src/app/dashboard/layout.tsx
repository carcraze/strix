"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import SecurityCheck from "@/components/SecurityCheck";

import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SecurityCheck>
            <WorkspaceProvider>
                <div className="min-h-screen bg-background text-foreground">
                    <div className="print:hidden">
                        <Sidebar />
                    </div>
                    <div className="pl-[280px] print:pl-0">
                        {children}
                    </div>
                </div>
            </WorkspaceProvider>
        </SecurityCheck>
    );
}

