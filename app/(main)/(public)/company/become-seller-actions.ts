"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAudit } from "@/lib/supabase/create-audit";
import { revalidatePath } from "next/cache";

export async function becomeSeller() {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "You must be logged in to become a seller." };
    }

    // Update user role to seller
    const { error: updateError } = await admin
        .from("users")
        .update({ user_role: "seller" })
        .eq("id", user.id);

    if (updateError) {
        console.error("Error updating user role:", updateError.message);
        return { success: false, error: "Failed to update user role." };
    }

    // Create audit log
    await createAudit({
        action_name: "BECOME_SELLER",
        action_description: "User switched role from buyer to seller",
        affected_resources: "users",
        actor: user.id
    });

    revalidatePath("/", "layout");
    return { success: true };
}
