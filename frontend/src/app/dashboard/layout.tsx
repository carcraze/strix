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
                <div className="min-h-screen bg-[var(--background)] text-foreground">
                    <Sidebar />
                    <div className="pl-[280px]">
                        {children}
                    </div>
                </div>
            </WorkspaceProvider>
        </SecurityCheck>
    );
}

