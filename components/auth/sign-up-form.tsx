"use client";

import { cn } from "@/lib/utils";
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
import { useState, useEffect } from "react";
import PithosLogo from "../PithosLogo";
import { validatePassword } from "@/lib/auth/password-rules";
import { getSystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, MailCheck } from "lucide-react";

type SignUpFormProps = React.HTMLAttributes<HTMLDivElement> & {
    createAudit: (params: {
        action_name: string;
        action_description?: string;
        affected_resources?: string;
    }) => Promise<void>;
};

export function SignUpForm({
    className,
    createAudit,
    ...props
}: SignUpFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [rules, setRules] = useState({
        min_char_length: 12,
        min_uppercase: 1,
        min_lowercase: 1,
        min_numbers: 1,
        min_spec_chars: 1
    });
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchRules = async () => {
            const { data, error } = await getSystemConfig();
            if (error) {
                console.error("Error fetching rules from server action:", error);
                return;
            }
            if (data) {
                setRules(data);
            }
        };
        fetchRules();
    }, []);

    // Handle TOTP timer countdown
    useEffect(() => {
        if (!showMfaSetup) return;
        const updateTimer = () => {
            const now = Date.now();
            const remaining = 30 - Math.floor((now / 1000) % 30);
            setTimeRemaining(remaining);
        };
        updateTimer();
        // Update more frequently (every 100ms) for better sync
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [showMfaSetup]);

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        const errors = validatePassword(value, rules);
        setPasswordErrors(errors);
    };

    const handleMfaVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/verify-mfa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, mfaCode, factorId }),
            });

            const result = await response.json();

            if (!response.ok || result.status === 'error') {
                throw new Error(result.message || 'MFA verification failed');
            }

            setSuccess("Account created and MFA setup complete! Please check your email for the activation link.");
            setShowMfaSetup(false);
            setMfaCode("");
            setFactorId(null);
            setQrCode(null);
            setSecret(null);

            await createAudit({
                action_name: "SIGN_UP_MFA_SUCCESS",
                action_description: "User successfully completed MFA setup during signup",
                affected_resources: "auth",
            });
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "MFA verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        if (password !== repeatPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const validationErrors = validatePassword(password, rules);
        if (validationErrors.length > 0) {
            setError(`Password must contain: ${validationErrors.join(', ')}.`);
            setIsLoading(false);
            return;
        }

        if (!captchaToken) {
            setError("Please complete the CAPTCHA");
            await createAudit({
                action_name: "SIGN_UP_FAILED",
                action_description: "User did not complete the CAPTCHA",
                affected_resources: "auth",
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, captchaToken }),
            });

            const result = await response.json();

            if (!response.ok) {
                await createAudit({
                    action_name: "SIGN_UP_FAILED",
                    action_description: "User failed creating an account",
                    affected_resources: "auth",
                });
                throw new Error(result.message || 'Registration failed');
            }

            // Check if MFA setup is required
            if (result.status === 'mfa_setup_required') {
                setFactorId(result.factorId);
                setQrCode(result.qrCode);
                setSecret(result.secret);
                setShowMfaSetup(true);
                setSuccess("Account created! Please set up your authenticator app to complete registration.");
                return;
            }

            setSuccess("An activation link has been sent to your email. Please check your inbox and click the link to activate your account.");

            // Sign up success audit
            await createAudit({
                action_name: "SIGN_UP_SUCCESS",
                action_description: "User successfully created an account",
                affected_resources: "auth",
            });
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
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
                    <Link href="/" className="text-xs text-muted-foreground hover:underline w-fit mb-4 block">
                        &lt; Return
                    </Link>
                    <CardTitle className="text-2xl">Sign up</CardTitle>
                    <CardDescription>Create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                    {success && !showMfaSetup ? (
                        <div className="flex flex-col items-center gap-6 py-4 text-center">
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                <MailCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Check your email</h3>
                                <p className="text-sm text-muted-foreground">
                                    {success}
                                </p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/auth/login">
                                    Go to Login
                                </Link>
                            </Button>
                        </div>
                    ) : !showMfaSetup ? (
                        <form onSubmit={handleSignUp} noValidate>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="e.g. m@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
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
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    {password && (
                                        <div className="mt-2 space-y-1 text-xs">
                                            <div className={password.length >= rules.min_char_length ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                {password.length >= rules.min_char_length ? "✓" : "✗"} At least {rules.min_char_length} characters
                                            </div>
                                            <div className={rules.min_uppercase > 0 && (password.match(/[A-Z]/g) || []).length >= rules.min_uppercase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                {rules.min_uppercase > 0 && (password.match(/[A-Z]/g) || []).length >= rules.min_uppercase ? "✓" : "✗"} At least {rules.min_uppercase} uppercase letter(s)
                                            </div>
                                            <div className={rules.min_lowercase > 0 && (password.match(/[a-z]/g) || []).length >= rules.min_lowercase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                {rules.min_lowercase > 0 && (password.match(/[a-z]/g) || []).length >= rules.min_lowercase ? "✓" : "✗"} At least {rules.min_lowercase} lowercase letter(s)
                                            </div>
                                            <div className={rules.min_numbers > 0 && (password.match(/[0-9]/g) || []).length >= rules.min_numbers ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                {rules.min_numbers > 0 && (password.match(/[0-9]/g) || []).length >= rules.min_numbers ? "✓" : "✗"} At least {rules.min_numbers} number(s)
                                            </div>
                                            <div className={rules.min_spec_chars > 0 && (password.match(/[^A-Za-z0-9]/g) || []).length >= rules.min_spec_chars ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                {rules.min_spec_chars > 0 && (password.match(/[^A-Za-z0-9]/g) || []).length >= rules.min_spec_chars ? "✓" : "✗"} At least {rules.min_spec_chars} special character(s)
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="repeat-password">Repeat Password</Label>
                                    </div>
                                    <Input
                                        id="repeat-password"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        required
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                {error && (
                                    <div className=" rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                                        {error}
                                    </div>
                                )}
                                <div className="w-full flex justify-center">
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                        onSuccess={(token) => setCaptchaToken(token)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating an account...
                                        </>
                                    ) : "Sign up"}
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Already have an account?{" "}
                                <Link href="/auth/login" className="underline underline-offset-4">
                                    Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Set Up Authenticator App</h3>
                                <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
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
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">Or enter this secret manually:</p>
                                <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                                    {secret}
                                </div>
                            </div>
                            <form onSubmit={handleMfaVerification}>
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
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button type="submit" className="w-full" disabled={isLoading || mfaCode.length !== 6}>
                                        {isLoading ? "Verifying..." : "Complete Setup"}
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-4 text-center text-sm">
                                Already have an account?{" "}
                                <Link href="/auth/login" className="underline underline-offset-4">
                                    Login
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
