"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "./server";

type CreateAuditParams = {
    action_name: string;
    action_description?: string;
    affected_resources?: string;
    actor?: string;     
    email?: string;      
};

export async function createAudit({
    action_name,
    action_description,
    affected_resources,
    actor,
    email
}: CreateAuditParams) {

    try {
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        let finalActor: string | null = null;

        // Priority: explicit actor (already known user id)
        if (actor) {
            finalActor = actor;
        }

        // If no actor but email exists → lookup user id
        else if (email) {
            const { data: user, error: userError } = await supabaseAdmin
                .from("users")
                .select("id")
                .eq("user_email", email)
                .single();

            if (userError) {
                console.error("Failed to fetch user by email:", userError);
            } else {
                finalActor = user?.id ?? null;
            }
        }

        // Fallback: get from session claims
        else {
            const { data: claimsData } = await supabase.auth.getClaims();
            const claims = claimsData?.claims;
            finalActor = claims?.sub ?? null;
        }

        console.log("Audit actor:", finalActor);

        const { error } = await supabaseAdmin.rpc("create_audit", {
            action_name_input: action_name,
            action_description_input: action_description ?? null,
            affected_resource_input: affected_resources ?? null,
            actor_input: finalActor
        });

        if (error) {
            console.error("Audit log failed:", error);
            return;
        }

    } catch (error) {
        console.error("Create Audit Error:", error);
    }
}