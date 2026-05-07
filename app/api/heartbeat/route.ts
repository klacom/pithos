import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    const { data: { user }, error } = await supabaseServer.auth.getUser();

    if (error || !user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const role = user.user_metadata?.role || "buyer";

    const { data: policy } = await supabaseAdmin
        .from("session_policies")
        .select("timeout_minutes")
        .eq("role", role)
        .single();

    const timeoutMinutes = policy?.timeout_minutes || 30; // Default 30 mins as requested

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
        warningMinutes: Math.max(1, timeoutMinutes - 5)
    }), {
        headers: { "Content-Type": "application/json" }
    });
}