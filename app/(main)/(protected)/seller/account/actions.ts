"use server";

import { createClient } from "@/lib/supabase/server";

export async function changePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        if (!user.email) throw new Error("User email not found");

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            throw new Error("Current password is incorrect");
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        console.error("Error changing password:", error);
        return { success: false, error: error.message };
    }
}
