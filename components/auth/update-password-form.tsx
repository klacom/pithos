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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";



export function UpdatePasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [showMfa, setShowMfa] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(30);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkMfaStatus();
    }, []);

    // Handle TOTP timer countdown
    useEffect(() => {
        if (!showMfa) return;
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = 30 - Math.floor((now / 1000) % 30);
            setTimeRemaining(remaining);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [showMfa]);

    const checkMfaStatus = async () => {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        console.log("AAL levels:", data);
        if (error) {
            console.error("Error checking AAL:", error);
            return;
        }

        // If current level is aal1 but next level is aal2, MFA is required
        if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
            console.log("MFA required for password change");
            const { data: factors } = await supabase.auth.mfa.listFactors();
            console.log("Available factors:", factors);
            if (factors?.totp && factors.totp.length > 0) {
                const verifiedFactor = factors.totp.find(factor => factor.status === 'verified');
                console.log("Verified factor:", verifiedFactor);
                if (verifiedFactor) {
                    setFactorId(verifiedFactor.id);
                    setShowMfa(true);
                }
            }
        } else {
            console.log("MFA not required for password change");
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            
            // Get user role to determine correct redirect
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get user role from database
                const { data: userData } = await supabase
                    .from("users")
                    .select("user_role")
                    .eq("id", user.id)
                    .single();
                
                const role = userData?.user_role;
                
                // Redirect based on role
                if (role === "buyer") {
                    router.push("/buyer");
                } else if (role === "seller") {
                    router.push("/seller");
                } else if (role === "admin") {
                    router.push("/admin");
                } else {
                    // Fallback to account page if role is unknown
                    router.push("/account");
                }
            } else {
                // Fallback to account page
                router.push("/account");
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;
        
        setIsLoading(true);
        setError(null);

        try {
            // Challenge the MFA factor
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            if (challenge.error || !challenge.data?.id) {
                throw new Error(challenge.error?.message || "MFA challenge failed");
            }

            // Verify the MFA code
            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: mfaCode,
            });

            if (verify.error) {
                throw new Error(verify.error?.message || "Invalid MFA code");
            }

            // MFA verified, now update password
            await handlePasswordUpdate(e);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                    <CardDescription>
                        {showMfa 
                            ? "Please enter your MFA code and new password below."
                            : "Please enter your new password below."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={showMfa ? handleMfaVerification : handlePasswordUpdate}>
                        <div className="flex flex-col gap-6">
                            {showMfa && (
                                <div className="grid gap-2">
                                    <Label htmlFor="mfaCode">MFA Code</Label>
                                    <Input
                                        id="mfaCode"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Code expires in {timeRemaining}s
                                    </p>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="New password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading 
                                    ? "Processing..." 
                                    : showMfa 
                                        ? "Verify MFA & Update Password" 
                                        : "Save new password"
                                }
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
