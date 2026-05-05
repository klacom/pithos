import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    const { data, error } = await supabaseServer.auth.getUser();

    if (error) {
        console.error("Error fetching user:", error);
        return new Response("Internal Server Error", { status: 500 });
    }

    console.log("User data in heartbeat route:", data);

    if (!data.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { error: updateError } = await supabaseAdmin
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("user_id", data.user.id);

    if (updateError) {
        console.error("Error updating last_activity:", updateError);
        return new Response("Internal Server Error", { status: 500 });
    }

    return new Response("ok");
}