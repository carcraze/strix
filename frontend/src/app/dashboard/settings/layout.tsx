"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: "General", href: "/dashboard/settings/general" },
        { name: "Members", href: "/dashboard/settings/members" },
        { name: "Billing", href: "/dashboard/settings/billing" },
        { name: "Notifications", href: "/dashboard/settings/notifications" },
    ];

    return <>{children}</>;
}
