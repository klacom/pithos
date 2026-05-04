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
import PithosLogo from "./PithosLogo";
import { validatePassword } from "@/lib/auth/password-rules";
import { getSystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";
import { Turnstile } from "@marsidev/react-turnstile";

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

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        const errors = validatePassword(value, rules);
        setPasswordErrors(errors);
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
                                />
                            </div>
                            {error && (
                                <div className=" rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className=" rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                                    {success}
                                </div>
                            )}
                            <div className="w-full flex justify-center">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                                    onSuccess={(token) => setCaptchaToken(token)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                                {isLoading ? "Creating an account..." : "Sign up"}
                            </Button>
                        </div>
                        {/* <Separator /> */}
                        {/* <SocialAuthButtons /> */}
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="underline underline-offset-4">
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
