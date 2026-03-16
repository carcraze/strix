"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Workspace = {
    id: string;
    name: string;
    slug: string;
    plan: "free" | "starter" | "growth" | "scale" | "enterprise";
    role: string;
};

interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (ws: Workspace) => void;
    isLoading: boolean;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshWorkspaces = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch memberships and related organizations
            const { data: memberships, error } = await supabase
                .from('organization_members')
                .select(`
                    role,
                    organizations (
                        id,
                        name,
                        slug,
                        plan
                    )
                `)
                .eq('user_id', session.user.id);

            if (error) throw error;

            if (memberships && memberships.length > 0) {
                const fetchedWorkspaces: Workspace[] = memberships
                    .filter(m => m.organizations != null)
                    .map(m => {
                        const org = m.organizations as unknown as any;
                        return {
                            id: org.id,
                            name: org.name,
                            slug: org.slug,
                            plan: org.plan || "free",
                            role: m.role
                        };
                    });

                setWorkspaces(fetchedWorkspaces);

                // Check localStorage for previously active workspace, otherwise default to first
                const savedWsId = localStorage.getItem('zenithel_active_workspace_id');
                const savedWs = fetchedWorkspaces.find(ws => ws.id === savedWsId);

                if (savedWs) {
                    setActiveWorkspaceState(savedWs);
                } else if (fetchedWorkspaces.length > 0) {
                    setActiveWorkspaceState(fetchedWorkspaces[0]);
                }
            } else {
                setWorkspaces([]);
                setActiveWorkspaceState(null);
            }
        } catch (err) {
            console.error("Failed to fetch workspaces", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshWorkspaces();
    }, []);

    const setActiveWorkspace = (ws: Workspace) => {
        setActiveWorkspaceState(ws);
        localStorage.setItem('zenithel_active_workspace_id', ws.id);
    };

    return (
        <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, isLoading, refreshWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
