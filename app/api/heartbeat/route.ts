import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    const { data: { user }, error } = await supabaseServer.auth.getUser();

    if (error || !user) {
        return new Response("Unauthorized", { status: 401 });
    }

    // 1. Get user role from public.users table (same as middleware)
    const { data: userData } = await supabaseAdmin
        .from("users")
        .select("user_role")
        .eq("id", user.id)
        .single();

    const role = userData?.user_role || "buyer";

    // 2. Get session policy for this role
    const { data: policy } = await supabaseAdmin
        .from("session_policies")
        .select("timeout_minutes")
        .eq("role", role)
        .single();

    const dbTimeout = policy?.timeout_minutes || 30;
    const timeoutMinutes = Math.min(dbTimeout, 30); // Enforce 30 min maximum

    // 3. Calculate warning threshold based on custom scale
    let warningMinutes = 1;
    if (timeoutMinutes === 1) {
        warningMinutes = 0.5; // 30 seconds
    } else if (timeoutMinutes >= 2 && timeoutMinutes <= 5) {
        warningMinutes = 1;
    } else if (timeoutMinutes >= 6 && timeoutMinutes <= 15) {
        warningMinutes = 5;
    } else if (timeoutMinutes >= 16 && timeoutMinutes <= 25) {
        warningMinutes = 15;
    } else if (timeoutMinutes >= 26 && timeoutMinutes <= 30) {
        warningMinutes = 25;
    }

    const { data: session } = await supabaseAdmin
        .from("user_sessions")
        .select("last_activity")
        .eq("user_id", user.id)
        .single();

    const now = new Date();

    if (session) {
        const lastActivity = new Date(session.last_activity);
        const diffMinutes = (now.getTime() - lastActivity.getTime()) / 60000;
        
        if (diffMinutes > timeoutMinutes) {
            // Force logout in Supabase
            await supabaseServer.auth.signOut();
            
            // Delete the session record so middleware doesn't see an old one on refresh
            await supabaseAdmin
                .from("user_sessions")
                .delete()
                .eq("user_id", user.id);

            return new Response("Unauthorized", { status: 401 });
        }
    }

    const { error: upsertError } = await supabaseAdmin
        .from("user_sessions")
        .upsert({ 
            user_id: user.id, 
            last_activity: now.toISOString(),
        }, { onConflict: "user_id" });

    if (upsertError) {
        console.error("Error updating session:", upsertError);
        return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(JSON.stringify({ 
        ok: true, 
        timeoutMinutes,
        warningMinutes
    }), {
        headers: { "Content-Type": "application/json" }
    });
}