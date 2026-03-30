import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthListener from "@/components/AuthListener";
import Script from "next/script";
import { CSPostHogProvider } from "@/components/PostHogProvider";

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
    variable: "--font-dm-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
});

export const metadata: Metadata = {
    metadataBase: new URL('https://zentinel.dev'),
    title: {
        default: "Zentinel | AI Penetration Testing Platform for Startups & Enterprises",
        template: "%s | Zentinel"
    },
    description: "Autonomous AI penetration testing that finds, validates, and fixes real vulnerabilities with zero false positives. SOC 2, ISO 27001, and compliance-ready pentest reports in minutes. Replace manual pentests, reduce costs by 95%.",
    keywords: [
        "AI penetration testing",
        "automated pentesting",
        "penetration testing cost",
        "AI security testing",
        "DevSecOps platform",
        "DAST tool",
        "application security testing",
        "vulnerability scanner",
        "SOC 2 pentest",
        "ISO 27001 compliance",
        "GitHub security integration",
        "autonomous security testing",
        "pentest automation",
        "SAST DAST IAST",
        "Zentinel vs Snyk",
        "best pentesting tools 2026",
        "startup security platform"
    ],
    authors: [{ name: "Zentinel Security" }],
    creator: "Zentinel",
    publisher: "Zentinel",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Zentinel | AI Penetration Testing Platform - Zero False Positives",
        description: "Autonomous AI pentesting that validates vulnerabilities with working exploits. SOC 2 & ISO 27001 compliance reports. Replace manual pentests, save 95%.",
        url: "https://zentinel.dev",
        siteName: "Zentinel",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Zentinel AI Penetration Testing Platform"
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Zentinel | AI Penetration Testing Platform",
        description: "Autonomous security testing with zero false positives. Find, validate, and fix vulnerabilities automatically.",
        creator: "@strix_ai",
        images: ["/logo.png"],
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
    },
    alternates: {
        canonical: "https://zentinel.dev"
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="llms-txt" href="/llms.txt" />
            </head>
            <body
                className={`${dmSans.variable} ${dmMono.variable} antialiased bg-background text-foreground font-body`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    disableTransitionOnChange
                >
                    <CSPostHogProvider>
                        <AuthListener />
                        {children}
                    </CSPostHogProvider>
                </ThemeProvider>

                {/* Google Analytics */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-8Y4NBFSHB7"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-8Y4NBFSHB7');
                    `}
                </Script>
            </body>
        </html>
    );
}
