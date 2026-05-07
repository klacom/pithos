import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const { count } = await supabase
        .from("cart")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    console.log("COUNT FETCH CALLED");

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
}