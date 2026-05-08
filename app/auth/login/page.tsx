import { LoginForm } from "@/components/auth/login-form";
import { createAudit } from "@/lib/supabase/create-audit";
import { Suspense } from "react";

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10 text-white">
            <div className="w-full max-w-sm">
                <Suspense fallback={<div className="text-white">Loading login form...</div>}>
                    <LoginForm createAudit={createAudit} />
                </Suspense>
            </div>
        </div>
    );
}