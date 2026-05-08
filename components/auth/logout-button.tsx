"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

export function LogoutButton({ createAudit }: any) {
    const supabase = createClient();
    const logout = async () => {
        // Use the global scope to ensure it logs out from everywhere, clearing session data properly
        await supabase.auth.signOut({ scope: 'local' });

        // Force a hard navigation instead of router.push to clear any lingering client-side state
        window.location.href = "/auth/login";
    };

    return <Button variant={'red_ghost'} className="justify-start items-center flex flex-row gap-4" onClick={async () => {
        logout();
        await createAudit({
            action_name: "LOGOUT_ATTEMPT",
            action_description: "User tried to logout of an account",
            affected_resources: "auth",
        });
    }}>
        <LogOut size={18} />
        Logout
    </Button>;
}
