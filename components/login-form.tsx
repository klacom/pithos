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
import { Turnstile } from "@marsidev/react-turnstile";

type LoginFormProps = React.HTMLAttributes<HTMLDivElement> & {
    createAudit: (params: {
        action_name: string;
        action_description?: string;
        affected_resources?: string;
        actor?: string;
        email?: string;
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
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(30);
    const router = useRouter();

    // Force sign out if they hit the login page (prevents lingering AAL1 sessions)
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.signOut({ scope: 'local' });
    }, []);

    // Handle TOTP timer countdown
    useEffect(() => {
        if (!showMfa && !showMfaSetup) return;
        const updateTimer = () => {
            const remaining = 30 - Math.floor((Date.now() / 1000) % 30);
            setTimeRemaining(remaining);
        };
        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [showMfa, showMfaSetup]);

    const handleCancelMfa = async () => {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: 'local' });
        setShowMfa(false);
        setShowMfaSetup(false);
        setMfaCode("");
        setPassword("");
        setQrCode(null);
        setSecret(null);
        setFactorId(null);
        setError(null);
    };

    const handleVerifySetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    mfaCode,
                    factorId,
                    captchaToken,
                }),
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Received non-JSON response:", text);
                throw new Error(`Server returned HTML (Error ${res.status}). Check server logs.`);
            }

            const result = await res.json();

            if (!res.ok || result.status === "error") {
                throw new Error(result.message);
            }

            setShowMfa(true);
            setShowMfaSetup(false);

            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    type AuthData = {
        user: any;
        session: any;
    } | null;

    const [userData, setUserData] = useState<AuthData>(null);
    const [maxAttempts, setMaxAttempts] = useState(3);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                    captchaToken,
                    // only send MFA if user is in MFA step
                    mfaCode: (showMfa || showMfaSetup) ? mfaCode : undefined,
                    factorId: (showMfa || showMfaSetup) ? factorId : undefined,
                }),
            });

            // Check Error
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Received non-JSON response:", text);
                throw new Error(`Server returned HTML (Error ${res.status}). Check server logs.`);
            }

            const result = await res.json();

            if (!res.ok || result.status === "error") {
                throw new Error(result.message);
            }

            // MFA STEP
            if (result.status === "mfa_setup") {
                setFactorId(result.factorId);
                setQrCode(result.qrCode);
                setSecret(result.secret);
                setShowMfaSetup(true);
                setShowMfa(false);
                setIsLoading(false);
                return;
            }

            // SUCCESS
            if (result.status === "ok") {
                await createAudit({
                    action_name: showMfa ? "LOGIN_SUCCESS_MFA" : "LOGIN_SUCCESS",
                    action_description: "User logged in successfully",
                    affected_resources: "auth",
                    email: email,
                });

                router.push("/");
                return;
            }

            throw new Error("Unexpected response");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>

            {/* Logo */}
            <div className="flex items-center gap-3 text-4xl font-bold uppercase">
                <PithosLogo size={60} color="foreground" />
                <span className="font-inter tracking-wide text-foreground">PITHOS</span>
            </div>

            {/* Login Card */}
            <Card className="w-full">

                {/* Card Header */}
                <CardHeader>
                    <div className="text-xs text-muted-foreground hover:underline w-fit mb-4 block cursor-pointer" onClick={async () => {
                        const supabase = createClient();
                        if (showMfa || showMfaSetup) {
                            await handleCancelMfa();
                        } else {
                            await supabase.auth.signOut({ scope: 'local' });
                            window.location.href = "/";
                        }
                    }}>
                        &lt; Return
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                        <CardTitle className="text-2xl">Login</CardTitle>
                        <CardDescription>
                            {showMfaSetup ? "Scan this QR code (required for every login) to get your one-time verification code" : (showMfa ? "Enter the current 6-digit code from your authenticator app (one-time use only)" : "Enter your email below to login to your account")}
                        </CardDescription>
                    </div>
                </CardHeader>

                {/* Card Content */}
                <CardContent>

                    {/* Form */}
                    <div className="flex flex-col gap-6">
                        {showMfaSetup ? (
                            <div className="grid gap-4">
                                <div className="text-center">
                                    <h3 className="font-semibold text-lg">One-Time Verification Setup</h3>
                                    <p className="text-sm text-muted-foreground">Scan this QR code now with your authenticator app (you&apos;ll need to do this every time you login).</p>
                                </div>
                                <div className="flex justify-center">
                                    <div className="w-48 h-48 bg-white p-2 rounded-md flex items-center justify-center">
                                        <img
                                            src={qrCode || ''}
                                            alt="MFA QR Code"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="mfaCode">Verification Code</Label>
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
                            </div>
                        ) : showMfa ? (
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="mfaCode">One-Time Code</Label>
                                    <span className={cn("text-xs font-mono", timeRemaining <= 5 ? "text-red-500 font-bold" : "text-muted-foreground")}>
                                        {timeRemaining}s
                                    </span>
                                </div>
                                <Input
                                    id="mfaCode"
                                    type="text"
                                    placeholder="Enter current 6-digit code"
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
                                {/* Email Input */}
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

                                {/* Password INput */}
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

                                {/* Captcha */}
                                {/* <div className="w-full flex justify-center">
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                        onSuccess={(token) => setCaptchaToken(token)}

                                    />
                                </div> */}
                            </>
                        )}
                        {error && (
                            <div className=" rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            {/* {!showMfa && (
                                    <div className="w-full flex justify-center">
                                        <Turnstile
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                            onSuccess={(token) => setCaptchaToken(token)}

                                        />
                                    </div>
                                )} */}
                            <Button className="w-full" disabled={
                                isLoading ||
                                (showMfa && mfaCode.length !== 6) 
                                // || (!showMfa && !captchaToken)
                            } onClick={showMfaSetup ? handleVerifySetup : handleLogin}>
                                {isLoading ? (showMfa ? "Verifying..." : "Logging in...") : (showMfa ? "Verify Code" : "Login")}
                            </Button>
                            {(showMfa || showMfaSetup) && (
                                <Button variant="outline" className="w-full" onClick={handleCancelMfa} disabled={isLoading}>
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
                </CardContent>
            </Card>
        </div>
    );
}
