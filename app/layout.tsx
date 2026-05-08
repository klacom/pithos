import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ActivityTrackerWrapper from "@/components/session_time/ActivityTrackerWrapper";
import CookieConsent from "@/components/main-components/CookieConsent";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Pithos",
    description: "The coolest assets store in the world",
};

const geistSans = Geist({
    variable: "--font-geist-sans",
    display: "swap",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className={`${geistSans.className} antialiased overscroll-none h-screen`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <ActivityTrackerWrapper />
                        {children}
                        <CookieConsent />
                        <Toaster closeButton />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
