import { LoginForm } from "@/components/auth/login-form";
import { createAudit } from "@/lib/supabase/create-audit";

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10 text-white">
            <div className="w-full max-w-sm">
                <LoginForm createAudit={createAudit} />
            </div>
        </div>
    );
}