"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateUserName(fullName: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating user name:", error);
        return { success: false, error: error.message };
    }
}
