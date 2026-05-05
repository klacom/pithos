// components/NavBarLoader.tsx
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

export default async function NavBarLoader() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;

    let role = null;
    if (uid) {
        const { data } = await supabase
            .from("users")
            .select("user_role")
            .eq("id", uid)
            .single();
        role = data?.user_role ?? null;
    }

    return <NavBar role={role} />;
}