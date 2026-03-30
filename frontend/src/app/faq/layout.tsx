import { Metadata } from "next";

export const metadata: Metadata = {
    title: "FAQ — Frequently Asked Questions",
    description: "Everything you need to know about Zentinel's AI-powered penetration testing. Pricing, SOC 2 compliance, GitHub integrations, DevSecOps, SAST vs DAST, and how AI pentesting works. 45+ questions answered.",
    keywords: [
        "penetration testing FAQ",
        "AI pentesting questions",
        "how much does pentesting cost",
        "what is AI penetration testing",
        "best pentesting tools for startups",
        "Zentinel vs Snyk",
        "Zentinel vs GitHub Advanced Security",
        "SAST vs DAST vs IAST",
        "DevSecOps implementation",
        "SOC 2 pentest requirements",
        "broken access control prevention",
        "Next.js security scanning"
    ],
    openGraph: {
        title: "Zentinel FAQ — AI Penetration Testing Questions Answered",
        description: "Get answers about AI pentesting, pricing, compliance, and integrations. 45+ detailed questions covering everything from cost to technical implementation.",
        url: "https://zentinel.dev/faq",
        type: "website",
        images: [
            {
                url: "https://zentinel.dev/og-faq.png",
                width: 1200,
                height: 630,
                alt: "Zentinel FAQ - AI Penetration Testing Platform"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Zentinel FAQ — AI Pentesting Questions",
        description: "Everything you need to know about autonomous security testing, pricing, and compliance. 45+ questions answered.",
        images: ["https://zentinel.dev/og-faq.png"]
    },
    alternates: {
        canonical: "https://zentinel.dev/faq"
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        }
    }
};

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
