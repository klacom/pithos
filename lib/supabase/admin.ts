import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client for server-side operations
 * that require elevated privileges (e.g., user creation, deletion).
 * Should only be used in secure server-side contexts.
 */
function serviceRoleKey(): string {
    const key =
        process.env.SUPABASE_SERVICE_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
        throw new Error(
            "Missing SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY for admin Storage uploads.",
        );
    }
    return key;
}

export function createAdminClient() {
    return createClient(process.env.SUPABASE_URL!, serviceRoleKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
