import NavBarBuyer from "./buyer/NavBarBuyer";
import NavBarSeller from "./seller/NavBarSeller";
import NavBarAdmin from "./admin/NavBarAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NavBar = async () => {

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Get claims safely
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    const uid = claims?.sub;   // This can still be undefined

    // console.log("UID from navbar claims:", uid);

    let role: string | null = null;

    // Only query the users table if we actually have a valid uid
    if (uid) {
        const { data: roleRes, error } = await supabaseAdmin
            .from('users')
            .select('user_role')
            .eq('id', uid)
            .single();

        if (error) {
            console.error("Error fetching user role:", error);
            // Don't throw here in middleware — it can break navigation
            // Just continue with role = null (treat as no special role)
        } else {
            role = roleRes?.user_role || null;
            // console.log("User role:", role);
        }
    } else {
        console.log("Navbar No UID found — unauthenticated or invalid token");
    }

    if (claimsError) throw claimsError;

    switch (role) {
        case 'seller':
            return <NavBarSeller role={role} />;
        case 'admin':
            return <NavBarAdmin role={role} />;
        default:
            return <NavBarBuyer />;
    }
}

export default NavBar
