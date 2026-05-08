"use server";

import { createAudit } from "@/lib/supabase/create-audit";
import { createClient } from "@/lib/supabase/server";
import { ConsentSettings } from "@/components/main-components/CookieConsent";

/**
 * Logs the user's cookie consent choice to the audit logs.
 * This only works if the user is logged in.
 */
export async function logCookieConsentAudit(settings: ConsentSettings, action: "ACCEPTED" | "DECLINED" | "CUSTOMIZED") {
    try {
        const supabase = await createClient();
        const { data: userData } = await supabase.auth.getUser();
        
        // Only audit if there is a logged-in user
        if (userData?.user?.id) {
            const description = action === "CUSTOMIZED" 
                ? `User updated cookie preferences: Functional(${settings.functional}), Analytics(${settings.analytics})`
                : `User ${action.toLowerCase()} all non-essential cookies.`;

            await createAudit({
                action_name: `COOKIE_CONSENT_${action}`,
                action_description: description,
                affected_resources: "user_privacy_settings",
                actor: userData.user.id
            });
        }
    } catch (error) {
        console.error("Failed to log cookie consent audit:", error);
    }
}
