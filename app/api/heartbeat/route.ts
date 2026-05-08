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
    const timeoutMinutes = Math.min(dbTimeout, 1440); // Enforce 24 hour maximum (1440 mins)

    // 3. Calculate warning threshold (idle time before warning)
    // The scale provided refers to the WARNING DURATION (time remaining when warning appears)
    let warningDuration = 1;
    if (timeoutMinutes <= 1) {
        warningDuration = 0.5; // 30s remaining
    } else if (timeoutMinutes >= 2 && timeoutMinutes <= 5) {
        warningDuration = 1; // 1m remaining
    } else if (timeoutMinutes >= 6 && timeoutMinutes <= 10) {
        warningDuration = 5; // 5m remaining
    } else if (timeoutMinutes >= 11 && timeoutMinutes <= 20) {
        warningDuration = 10; // 10m remaining
    } else if (timeoutMinutes >= 21 && timeoutMinutes <= 25) {
        warningDuration = 20; // 20m remaining
    } else if (timeoutMinutes >= 26 && timeoutMinutes <= 30) {
        warningDuration = 25; // 25m remaining
    } else {
        warningDuration = 5; // Default 5m remaining for > 30m
    }

    const warningMinutes = Math.max(0.1, timeoutMinutes - warningDuration);

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
