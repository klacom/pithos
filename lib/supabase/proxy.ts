import { createAdminClient } from "./admin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedRoute, getAllowedRoutes } from "./site_routes";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
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

    // Skip Api routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    if (pathname.startsWith("/auth")) {
        return supabaseResponse;
    }

    if (!uid && isProtectedRoute(pathname)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    let role: string | null = null;
    let session: any = null;

    if (uid) {
        const [userRes, sessionRes] = await Promise.all([
            supabaseAdmin.from("users").select("user_role").eq("id", uid).single(),
            supabaseAdmin.from("user_sessions").select("*").eq("user_id", uid).single(),
        ]);

        role = userRes.data?.user_role ?? null;
        session = sessionRes.data;
    }

    // Session Timeout logic starts here

    if (uid && role) {
        if (session) {
            // Get policy based on role (using 'role' column as per your database)
            const { data: policy } = await supabaseAdmin
                .from("session_policies")
                .select("timeout_minutes")
                .eq("role", role)
                .single();

            const timeoutMinutes = Math.min(policy?.timeout_minutes || 30, 1440); // Enforce 24 hour maximum (1440 mins)
            
            const now = new Date();
            const lastActivity = new Date(session.last_activity);
            const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
            
            const diffMinutes = (now.getTime() - lastActivity.getTime()) / 60000;

            if (diffMinutes > timeoutMinutes) {
                // Check if user re-authenticated recently (more recent than our last_activity)
                if (lastSignIn && lastSignIn > lastActivity) {
                    // User just logged in, update our session tracker and continue
                    await supabaseAdmin
                        .from("user_sessions")
                        .update({ last_activity: now.toISOString() })
                        .eq("user_id", uid);
                } else {
                    // Truly inactive, logout the user
                    await supabase.auth.signOut();
                    // IMPORTANT: When logging out in middleware, we MUST clear the session data
                    // and redirect to login immediately to prevent any further logic execution.
                    const response = NextResponse.redirect(new URL("/auth/login", request.url));
                    // Clear the session cookies manually to be extra safe
                    response.cookies.delete('sb-access-token');
                    response.cookies.delete('sb-refresh-token');
                    return response;
                }
            } else {
                // Sliding session: Update activity timestamp on page navigation
                await supabaseAdmin
                    .from("user_sessions")
                    .update({ last_activity: now.toISOString() })
                    .eq("user_id", uid);
            }
        } else {
            // No session record exists for this authenticated user.
            // Check if they just signed in recently (last 30 seconds).
            // If they signed in a long time ago but have no session record, 
            // it means their session was deleted due to timeout.
            const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
            const now = new Date();
            const signedInSecondsAgo = lastSignIn ? (now.getTime() - lastSignIn.getTime()) / 1000 : 999999;

            if (signedInSecondsAgo < 30) {
                // User just logged in, create the initial session record
                await supabaseAdmin
                    .from("user_sessions")
                    .insert({ 
                        user_id: uid, 
                        last_activity: now.toISOString() 
                    });
            } else {
                // Session likely timed out and record was deleted. 
                // Redirect to login to prevent bypass.
                await supabase.auth.signOut();
                const response = NextResponse.redirect(new URL("/auth/login", request.url));
                response.cookies.delete('sb-access-token');
                response.cookies.delete('sb-refresh-token');
                return response;
            }
        }
    }

    // console.log("Role from proxy getUser:", role);

    // exclude server actions
    if (request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    if (uid && !role) {
        // return NextResponse.redirect(new URL("/unauthorized", request.url));
        return NextResponse.next();
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
            return NextResponse.redirect(new URL("/unauthorized", request.url));
            // return NextResponse.next();
        }
    }

    return supabaseResponse;
}