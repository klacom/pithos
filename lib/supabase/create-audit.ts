"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "./server";

type CreateAuditParams = {
    action_name: string;
    action_description?: string;
    affected_resources?: string;
};

export async function createAudit({
    action_name,
    action_description,
    affected_resources,
}: CreateAuditParams) {

    try {
        // get uuid of current user
        const supabase = await createClient();

        const { data: claimsData } = await supabase.auth.getClaims();
        const claims = claimsData?.claims;
        const uid = claims?.sub;   // This can still be undefined

        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin.rpc("create_audit", {
            action_name_input: action_name,
            action_description_input: action_description ?? null,
            affected_resource_input: affected_resources ?? null,
            actor_input: uid
        });

        if (error) {
            console.error("Audit log failed:", error);
            throw new Error("Failed to create audit log");
        } 
    } catch (error) {
        if (error) {
            console.error("Audit log failed:", error);
            throw new Error("Failed to create audit log");
        } 
    }
    
}