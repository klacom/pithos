"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createAudit } from "@/lib/supabase/create-audit";
import { createClient } from "@/lib/supabase/server";

export async function unlockUser(userId: string) {
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient();
    
    try {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                login_attempts: 0, 
                is_locked: false 
            })
            .eq('id', userId);

        if (error) throw error;

        // Audit Log
        try {
            const { data: claimsData } = await supabase.auth.getClaims();
            await createAudit({
                action_name: "USER_UNLOCKED",
                action_description: `Admin unlocked user account: ${userId}`,
                affected_resources: `users:${userId}`,
                actor: claimsData?.claims?.sub
            });
        } catch (auditError) {
            console.error("Audit failed for user unlock:", auditError);
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Error unlocking user:", error);
        return { success: false, error: error.message };
    }
}
