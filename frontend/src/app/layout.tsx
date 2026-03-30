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
    title: "Zentinel | The AI Pentester for High-Growth Startups",
    description: "Automated offensive security that finds, proves, and fixes vulnerabilities with zero false positives. Secure your code, APIs, and cloud in minutes.",
    keywords: ["AI Pentesting", "Offensive Security", "Vulnerability Scanning", "SOC 2 Compliance", "AutoFix", "Zentinel"],
    openGraph: {
        title: "Zentinel | The AI Pentester for High-Growth Startups",
        description: "Automated offensive security with zero false positives.",
        url: "https://zentinel.dev",
        siteName: "Zentinel",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
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
