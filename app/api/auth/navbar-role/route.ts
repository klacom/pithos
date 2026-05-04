import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get user from session
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return NextResponse.json({ role: null }, { status: 200 });
    }

    const uid = userData.user.id;

    // Fetch role securely from DB
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("user_role")
        .eq("id", uid)
        .single();

    if (error) {
        console.error("Role fetch error:", error);
        return NextResponse.json({ role: null }, { status: 200 });
    }

    return NextResponse.json({
        role: data?.user_role ?? null,
    });
}