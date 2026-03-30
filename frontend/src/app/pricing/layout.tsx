import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing — Transparent AI Pentesting Plans",
    description: "Zentinel pricing: Quick Scan $49, Full Stack Scan $199, Compliance Report $299. Subscriptions from $149/month with unlimited scans. Compare Zentinel vs traditional pentests ($5K-$50K). 20% off annual plans.",
    keywords: [
        "penetration testing pricing",
        "pentesting cost",
        "AI security pricing",
        "SOC 2 pentest cost",
        "compliance report pricing",
        "startup security pricing",
        "Zentinel pricing",
        "pentesting subscription",
        "automated pentest cost"
    ],
    openGraph: {
        title: "Zentinel Pricing — Affordable AI Pentesting for Startups",
        description: "One-time scans from $49 or unlimited monthly scans from $149/mo. Replace $5K-$50K manual pentests with AI automation.",
        url: "https://zentinel.dev/pricing",
        type: "website",
        images: [
            {
                url: "https://zentinel.dev/og-pricing.png",
                width: 1200,
                height: 630,
                alt: "Zentinel Pricing Plans"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Zentinel Pricing — AI Pentesting from $49",
        description: "Unlimited scans from $149/mo. 95% cheaper than traditional pentests.",
        images: ["https://zentinel.dev/og-pricing.png"]
    },
    alternates: {
        canonical: "https://zentinel.dev/pricing"
    }
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
