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
    title: "Zentinel | The AI Pentester for Solo Founders",
    description: "Automated pentesting that validates bugs with real PoCs. No false positives, just fixes.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
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
