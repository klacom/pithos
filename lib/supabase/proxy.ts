import { createAdminClient } from "./admin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedRoute, getAllowedRoutes } from "./site_routes";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    supabaseResponse = NextResponse.next({ request });
                    
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const supabaseAdmin = createAdminClient();

    // Get user safely, not using claims
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id;
    
    // console.log("UID from proxy getUser:", uid);
    // console.log("Data of User from proxy getUser:", user);

    const pathname = request.nextUrl.pathname;

    if (!uid && isProtectedRoute(pathname)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    let role: string | null = null;

    if (uid) {
        const { data } = await supabaseAdmin
            .from("users")
            .select("user_role")
            .eq("id", uid)
            .single();

        role = data?.user_role ?? null;
    }

    // console.log("Role from proxy getUser:", role);

    // exclude server actions
    if (request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    if (uid && !role) {
        // return NextResponse.redirect(new URL("/unauthorized", request.url));
        return;
    }

    // Skip Api routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    // Public route — everyone can access
    if (pathname === "/") {
        return supabaseResponse;
    }

    // Protected route but not logged in
    if (isProtectedRoute(pathname) && !uid) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Role-based access check (only if logged in)
    if (uid) {
        const allowedRoutes = getAllowedRoutes(role || "");

        const hasAccess = allowedRoutes.some((route) =>
            pathname.startsWith(route)
        );

        if (!hasAccess) {
            // return NextResponse.redirect(new URL("/unauthorized", request.url));
            return;
        }
    }

    return supabaseResponse;
}