"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PithosLogo from "./PithosLogo";
import { getSystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";

type LoginFormProps = React.HTMLAttributes<HTMLDivElement> & {
    createAudit: (params: {
        action_name: string;
        action_description?: string;
        affected_resources?: string;
    }) => Promise<void>;
};

export function LoginForm({
    className,
    createAudit,
    ...props
}: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showMfa, setShowMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [factorId, setFactorId] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(30);
    const router = useRouter();

    // Force sign out if they hit the login page (prevents lingering AAL1 sessions)
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.signOut({ scope: 'local' });
    }, []);

    // Handle TOTP timer countdown
    useEffect(() => {
        if (!showMfa) return;
        const updateTimer = () => {
            const remaining = 30 - Math.floor((Date.now() / 1000) % 30);
            setTimeRemaining(remaining);
        };
        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [showMfa]);

    const handleCancelMfa = async () => {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: 'local' });
        setShowMfa(false);
        setMfaCode("");
        setPassword("");
        setError(null);
    };

    const [maxAttempts, setMaxAttempts] = useState(3);

    useEffect(() => {
        const fetchMaxAttempts = async () => {
            const { data, error } = await getSystemConfig();
            if (error) {
                console.error("Error fetching max attempts from server action:", error);
                return;
            }
            if (data?.max_login_attempts) {
                setMaxAttempts(data.max_login_attempts);
            }
        };
        fetchMaxAttempts();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            if (showMfa && factorId) {
                // Verify MFA code
                const challenge = await supabase.auth.mfa.challenge({ factorId });
                if (challenge.error) throw challenge.error;

                const verify = await supabase.auth.mfa.verify({
                    factorId,
                    challengeId: challenge.data.id,
                    code: mfaCode,
                });

                if (verify.error) throw verify.error;

                // Reset login attempts and redirect on success
                await supabase.rpc("reset_login_attempts", { login_email: email });
                router.push("/");
                return;
            }

            // 1. Attempt login via Supabase first so we can track the attempt
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            // 2. Handle failure (increment attempts unconditionally)
            if (error) {
                if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
                    // don't increment for unconfirmed email, but we might want to check the error message
                    if (error.message.includes("Email not confirmed")) {
                        throw new Error("Please check your email and verify your account before logging in.");
                    }
                    const { data: status } = await supabase.rpc("handle_failed_login", { login_email: email });

                    if (status?.is_locked) {
                        throw new Error(`Account is locked due to too many failed attempts (${status.login_attempts} total). Please contact support.`);
                    } else if (status?.login_attempts) {
                        const attemptsLeft = maxAttempts - status.login_attempts;
                        throw new Error(`Invalid credentials. You have ${attemptsLeft} attempt(s) left.`);
                    }
                }
                throw error;
            }

            // 3. Even if password is correct, we must check if account was ALREADY locked 
            // from previous attempts before we let them in.
            const { data: isLocked } = await supabase.rpc("check_account_locked", { login_email: email });
            if (isLocked) {
                // If they managed to guess the password AFTER getting locked, we still block them
                // and we immediately sign them back out
                await supabase.auth.signOut();
                throw new Error("Account is locked. Even with the correct password, you must contact support to unlock it.");
            }

            // Check if MFA is required
            const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfaError) throw mfaError;

            if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
                const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
                if (factorsError) throw factorsError;

                const totpFactor = factorsData.totp.find((factor) => factor.status === 'verified');
                if (totpFactor) {
                    setFactorId(totpFactor.id);
                    setShowMfa(true);
                    return;
                }
            }

            // 4. Handle true success (correct password AND not locked AND no MFA required)
            await supabase.rpc("reset_login_attempts", { login_email: email });

            router.push("/");
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
            try {
                await createAudit({
                    action_name: "LOGIN_ATTEMPT",
                    action_description: "User tried logging in",
                    affected_resources: "auth",
                });
            } catch (error) {
                console.log(error);
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>

            <div className="flex items-center gap-3 text-4xl font-bold uppercase">
                <PithosLogo size={60} color="foreground" />
                <span className="font-inter tracking-wide text-foreground">PITHOS</span>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <div className="text-xs text-muted-foreground hover:underline w-fit mb-4 block cursor-pointer" onClick={() => {
                        if (showMfa) {
                            handleCancelMfa();
                        } else {
                            window.location.href = "/";
                        }
                    }}>
                        &lt; Return
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                        <CardTitle className="text-2xl">Login</CardTitle>
                        <CardDescription>
                            {showMfa ? "Enter the 6-digit code from your authenticator app (1 minute grace period)" : "Enter your email below to login to your account"}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} noValidate>
                        <div className="flex flex-col gap-6">
                            {showMfa ? (
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="mfaCode">Authenticator Code</Label>
                                        <span className={cn("text-xs font-mono", timeRemaining <= 5 ? "text-red-500 font-bold" : "text-muted-foreground")}>
                                            {timeRemaining}s
                                        </span>
                                    </div>
                                    <Input
                                        id="mfaCode"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        required
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        maxLength={6}
                                    />
                                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full mt-1">
                                        <div
                                            className={cn("h-full transition-all duration-1000 ease-linear", timeRemaining <= 5 ? "bg-red-500" : "bg-primary")}
                                            style={{ width: `${(timeRemaining / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <Link
                                            href="/auth/forgot-password"
                                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                        >
                                            Forgot your password?
                                        </Link>
                                    </div>
                                </>
                            )}
                            {error && (
                                <div className=" rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={isLoading || (showMfa && mfaCode.length !== 6)}>
                                    {isLoading ? (showMfa ? "Verifying..." : "Logging in...") : (showMfa ? "Verify Code" : "Login")}
                                </Button>
                                {showMfa && (
                                    <Button type="button" variant="outline" className="w-full" onClick={handleCancelMfa} disabled={isLoading}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                        {!showMfa && (
                            <>
                                {/* <Separator /> */}
                                {/* <SocialAuthButtons /> */}
                                <div className="mt-4 text-center text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href="/auth/sign-up"
                                        className="underline underline-offset-4"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
