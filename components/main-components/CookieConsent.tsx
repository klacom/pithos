"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ShieldCheck, PieChart, Settings } from "lucide-react";
import Link from "next/link";
import { logCookieConsentAudit } from "@/lib/actions/privacy-actions";

export type ConsentSettings = {
    essential: boolean; // Always true
    functional: boolean; // Theme, language, etc.
    analytics: boolean; // Google Analytics, etc.
};

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [settings, setSettings] = useState<ConsentSettings>({
        essential: true,
        functional: true,
        analytics: false,
    });

    useEffect(() => {
        const savedConsent = localStorage.getItem("cookie-consent-settings");
        if (!savedConsent) {
            setIsVisible(true);
        } else {
            setSettings(JSON.parse(savedConsent));
        }
    }, []);

    const saveConsent = (newSettings: ConsentSettings, action: "ACCEPTED" | "DECLINED" | "CUSTOMIZED") => {
        localStorage.setItem("cookie-consent-settings", JSON.stringify(newSettings));
        setSettings(newSettings);
        setIsVisible(false);

        // Audit log (Server Side)
        logCookieConsentAudit(newSettings, action);

        // Dispatch custom event so other components can react
        window.dispatchEvent(new CustomEvent("consent-updated", { detail: newSettings }));
    };

    const acceptAll = () => {
        saveConsent({ essential: true, functional: true, analytics: true }, "ACCEPTED");
    };

    const declineAll = () => {
        saveConsent({ essential: true, functional: false, analytics: false }, "DECLINED");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-lg bg-card border border-muted shadow-2xl rounded-2xl p-6 z-[9999] animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-primary" size={24} />
                        <h3 className="text-lg font-bold">Privacy Settings</h3>
                    </div>
                    <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {!showDetails ? (
                    <>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We use cookies to improve your experience. **Essential cookies** are required for the site to work (like logging in). Others help us analyze traffic and remember your preferences.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-between items-center mt-2">
                            <button
                                onClick={() => setShowDetails(true)}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                Customize Settings
                            </button>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={declineAll}>
                                    Decline Non-Essential
                                </Button>
                                <Button size="sm" onClick={acceptAll}>
                                    Accept All
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4 py-2">
                        {/* Essential */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <Settings className="mt-1 text-muted-foreground" size={18} />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold">Essential (Required)</span>
                                    <span className="text-xs text-primary font-bold">Always On</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Needed for authentication, security, and basic functionality.</p>
                            </div>
                        </div>

                        {/* Functional */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <Settings className="mt-1 text-primary" size={18} />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold">Functional</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.functional}
                                        onChange={(e) => setSettings({ ...settings, functional: e.target.checked })}
                                        className="rounded border-muted bg-background text-primary focus:ring-primary"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Remembers your theme, language, and layout preferences.</p>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <PieChart className="mt-1 text-primary" size={18} />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold">Analytics</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.analytics}
                                        onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                                        className="rounded border-muted bg-background text-primary focus:ring-primary"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Helps us understand how you use the site so we can improve it.</p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-2">
                            <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
                                Back
                            </Button>
                            <Button size="sm" onClick={() => saveConsent(settings, "CUSTOMIZED")}>
                                Save My Choices
                            </Button>
                        </div>
                    </div>
                )}

                <p className="text-[10px] text-muted-foreground text-center">
                    By saving, you agree to our <Link href="/privacy" className="underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
}
