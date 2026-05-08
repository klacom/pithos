"use client";

import { useState, useEffect } from "react";
import { ConsentSettings } from "@/components/main-components/CookieConsent";

/**
 * Hook to manage and check user cookie consent settings.
 * Use this to conditionally load scripts (like Analytics) or features.
 */
export function useConsent() {
    const [consent, setConsent] = useState<ConsentSettings>({
        essential: true,
        functional: true,
        analytics: false,
    });

    useEffect(() => {
        // Initial load
        const saved = localStorage.getItem("cookie-consent-settings");
        if (saved) {
            setConsent(JSON.parse(saved));
        }

        // Listen for updates from the CookieConsent component
        const handleUpdate = (event: any) => {
            setConsent(event.detail);
        };

        window.addEventListener("consent-updated", handleUpdate);
        return () => window.removeEventListener("consent-updated", handleUpdate);
    }, []);

    return consent;
}
