"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { validatePassword } from "@/lib/auth/password-rules";
import { getSystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";
import { createClient } from "@/lib/supabase/client";
import { getTOTPSecret, enrollTOTP, verifyTOTP } from "@/lib/totp";

export default function SecurityPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [rules, setRules] = useState({
        min_char_length: 12,
        min_uppercase: 1,
        min_lowercase: 1,
        min_numbers: 1,
        min_spec_chars: 1
    });
    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [showTotpSetup, setShowTotpSetup] = useState(false);
    const [newTotpQrCode, setNewTotpQrCode] = useState<string | null>(null);
    const [newTotpSecret, setNewTotpSecret] = useState<string | null>(null);
    const [newFactorId, setNewFactorId] = useState<string | null>(null);
    const [totpVerificationCode, setTotpVerificationCode] = useState("");
    const [isTotpLoading, setIsTotpLoading] = useState(false);
    const [showMfaForPasswordChange, setShowMfaForPasswordChange] = useState(false);
    const [passwordMfaCode, setPasswordMfaCode] = useState("");
    const [passwordMfaFactorId, setPasswordMfaFactorId] = useState<string | null>(null);
    const [isPasswordMfaLoading, setIsPasswordMfaLoading] = useState(false);
    const [passwordTimeRemaining, setPasswordTimeRemaining] = useState(30);

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

    useEffect(() => {
        const fetchTotpSecret = async () => {
            try {
                const secret = await getTOTPSecret();
                setTotpSecret(secret);
            } catch (error) {
                console.error('Error fetching TOTP secret:', error);
            }
        };
        fetchTotpSecret();
        
        // Check MFA status for password change
        checkMfaForPasswordChange();
        
        // Setup timer for MFA if needed
        setupPasswordMfaTimer();
    }, []);

    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        const errors = validatePassword(value, rules);
        setPasswordErrors(errors);
    };

    const checkMfaForPasswordChange = async () => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            console.log("Security page AAL levels:", data);
            if (error) {
                console.error("Error checking AAL:", error);
                return;
            }

            // If current level is aal1 but next level is aal2, MFA is required for password change
            if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
                console.log("MFA required for password change in security page");
                const { data: factors } = await supabase.auth.mfa.listFactors();
                console.log("Security page available factors:", factors);
                if (factors?.totp && factors.totp.length > 0) {
                    const verifiedFactor = factors.totp.find(factor => factor.status === 'verified');
                    console.log("Security page verified factor:", verifiedFactor);
                    if (verifiedFactor) {
                        setPasswordMfaFactorId(verifiedFactor.id);
                        setShowMfaForPasswordChange(true);
                    }
                }
            } else {
                console.log("MFA not required for password change in security page");
            }
        } catch (error) {
            console.error('Error checking MFA status:', error);
        }
    };

    const setupPasswordMfaTimer = () => {
        if (!showMfaForPasswordChange) return;
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = 30 - Math.floor((now / 1000) % 30);
            setPasswordTimeRemaining(remaining);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    };

    useEffect(() => {
        const cleanup = setupPasswordMfaTimer();
        return cleanup;
    }, [showMfaForPasswordChange]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        const validationErrors = validatePassword(newPassword, rules);
        if (validationErrors.length > 0) {
            toast.error(`Password must contain: ${validationErrors.join(', ')}.`);
            return;
        }

        if (showMfaForPasswordChange) {
            await handlePasswordMfaVerification(e);
        } else {
            await handlePasswordChangeDirect(e);
        }
    };

    const handlePasswordChangeDirect = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const supabase = createClient();
        
        try {
            // First verify current password
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                toast.error("User email not found");
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                toast.error("Current password is incorrect");
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordMfaVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordMfaFactorId) return;
        
        setIsPasswordMfaLoading(true);
        const supabase = createClient();
        
        try {
            // First verify current password
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                toast.error("User email not found");
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                toast.error("Current password is incorrect");
                return;
            }

            // Challenge MFA factor
            const challenge = await supabase.auth.mfa.challenge({ factorId: passwordMfaFactorId });
            if (challenge.error || !challenge.data?.id) {
                throw new Error(challenge.error?.message || "MFA challenge failed");
            }

            // Verify MFA code
            const verify = await supabase.auth.mfa.verify({
                factorId: passwordMfaFactorId,
                challengeId: challenge.data.id,
                code: passwordMfaCode,
            });

            if (verify.error) {
                throw new Error(verify.error?.message || "Invalid MFA code");
            }

            // MFA verified, now update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMfaCode("");
            
        } catch (error: any) {
            toast.error(error.message || "Failed to verify MFA or update password");
        } finally {
            setIsPasswordMfaLoading(false);
        }
    };

    const handleSetupNewTotp = async () => {
        setIsTotpLoading(true);
        try {
            const enrollmentData = await enrollTOTP();
            setNewTotpQrCode(enrollmentData.qrCode);
            setNewTotpSecret(enrollmentData.secret);
            setNewFactorId(enrollmentData.factorId);
            setShowTotpSetup(true);
            toast.success("New TOTP setup initiated");
        } catch (error: any) {
            toast.error(error.message || "Failed to setup new TOTP");
        } finally {
            setIsTotpLoading(false);
        }
    };

    const handleVerifyNewTotp = async () => {
        if (!newFactorId || !totpVerificationCode) {
            toast.error("Missing verification code");
            return;
        }

        setIsTotpLoading(true);
        try {
            const isValid = await verifyTOTP(newFactorId, totpVerificationCode);
            if (isValid) {
                setTotpSecret(newTotpSecret);
                setShowTotpSetup(false);
                setNewTotpQrCode(null);
                setNewTotpSecret(null);
                setNewFactorId(null);
                setTotpVerificationCode("");
                toast.success("TOTP setup completed successfully");
            } else {
                toast.error("Invalid verification code");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to verify TOTP");
        } finally {
            setIsTotpLoading(false);
        }
    };

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'>
            <div className='flex flex-col gap-2'>
                <h1 className='font-bold text-3xl'>Security Settings</h1>
                <p className='text-muted-foreground'>Your account is protected by Multi-Factor Authentication by default.</p>
            </div>


            {/* Change Password Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Change Password</h1>
                    <p className='text-muted-foreground'>Update your password to keep your account secure.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='current-password'>Current Password</Label>
                                <Input
                                    id='current-password'
                                    type='password'
                                    placeholder='Enter your current password'
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='new-password'>New Password</Label>
                                <Input
                                    id='new-password'
                                    type='password'
                                    placeholder='Enter your new password'
                                    value={newPassword}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                />
                                {newPassword && (
                                    <div className="mt-2 space-y-1 text-xs">
                                        <div className={newPassword.length >= rules.min_char_length ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {newPassword.length >= rules.min_char_length ? "✓" : "✗"} At least {rules.min_char_length} characters
                                        </div>
                                        <div className={rules.min_uppercase > 0 && (newPassword.match(/[A-Z]/g) || []).length >= rules.min_uppercase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {rules.min_uppercase > 0 && (newPassword.match(/[A-Z]/g) || []).length >= rules.min_uppercase ? "✓" : "✗"} At least {rules.min_uppercase} uppercase letter(s)
                                        </div>
                                        <div className={rules.min_lowercase > 0 && (newPassword.match(/[a-z]/g) || []).length >= rules.min_lowercase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {rules.min_lowercase > 0 && (newPassword.match(/[a-z]/g) || []).length >= rules.min_lowercase ? "✓" : "✗"} At least {rules.min_lowercase} lowercase letter(s)
                                        </div>
                                        <div className={rules.min_numbers > 0 && (newPassword.match(/[0-9]/g) || []).length >= rules.min_numbers ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {rules.min_numbers > 0 && (newPassword.match(/[0-9]/g) || []).length >= rules.min_numbers ? "✓" : "✗"} At least {rules.min_numbers} number(s)
                                        </div>
                                        <div className={rules.min_spec_chars > 0 && (newPassword.match(/[^A-Za-z0-9]/g) || []).length >= rules.min_spec_chars ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {rules.min_spec_chars > 0 && (newPassword.match(/[^A-Za-z0-9]/g) || []).length >= rules.min_spec_chars ? "✓" : "✗"} At least {rules.min_spec_chars} special character(s)
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                                <Input
                                    id='confirm-password'
                                    type='password'
                                    placeholder='Confirm your new password'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {showMfaForPasswordChange && (
                                <div className='flex flex-col gap-2'>
                                    <Label htmlFor='password-mfa-code'>MFA Code</Label>
                                    <Input
                                        id='password-mfa-code'
                                        type='text'
                                        placeholder='Enter 6-digit code'
                                        value={passwordMfaCode}
                                        onChange={(e) => setPasswordMfaCode(e.target.value)}
                                        maxLength={6}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Code expires in {passwordTimeRemaining}s
                                    </p>
                                </div>
                            )}

                            <div className='flex justify-end'>
                                <Button type='submit' variant='red_default' disabled={isLoading || isPasswordMfaLoading}>
                                    {(isLoading || isPasswordMfaLoading) 
                                        ? "Processing..." 
                                        : showMfaForPasswordChange 
                                            ? "Verify MFA & Change Password" 
                                            : "Change Password"
                                    }
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>

            {/* MFA Settings Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Authenticator App</h1>
                    <p className='text-muted-foreground'>Manage your two-factor authentication setup.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        {!showTotpSetup ? (
                            <>
                                {totpSecret ? (
                                    <>
                                        <div className='flex flex-col gap-4'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                                                <h3 className='font-semibold text-lg'>MFA is Enabled</h3>
                                            </div>
                                            <p className='text-sm text-muted-foreground'>Your account is protected with two-factor authentication.</p>
                                            <div className='bg-muted p-4 rounded-lg'>
                                                <p className='text-sm font-medium mb-2'>Your Authenticator Secret:</p>
                                                <p className='text-xs font-mono break-all'>{totpSecret}</p>
                                            </div>
                                            <div className='text-sm text-muted-foreground'>
                                                <p>• Use this secret to set up your authenticator app on multiple devices</p>
                                                <p>• Keep this secret safe and secure</p>
                                                <p>• Only share with trusted authenticator apps</p>
                                            </div>
                                        </div>
                                        <div className='flex gap-2'>
                                            <Button variant="outline" onClick={handleSetupNewTotp} disabled={isTotpLoading}>
                                                {isTotpLoading ? "Regenerating..." : "Regenerate Secret"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='flex flex-col gap-4'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                                                <h3 className='font-semibold text-lg'>MFA Not Found</h3>
                                            </div>
                                            <p className='text-sm text-muted-foreground'>No MFA setup detected. This should have been configured during signup.</p>
                                            <div className='text-sm text-muted-foreground'>
                                                <p>• Please sign up again to enable MFA</p>
                                                <p>• Contact support if you believe this is an error</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <div className='flex flex-col gap-4'>
                                    <h3 className='font-semibold text-lg'>Setup New Authenticator App</h3>
                                    <p className='text-sm text-muted-foreground'>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                                </div>
                                <div className='flex justify-center'>
                                    <div className='w-48 h-48 bg-white p-2 rounded-md flex items-center justify-center'>
                                        <img
                                            src={newTotpQrCode || ''}
                                            alt="MFA QR Code"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className='text-center'>
                                    <p className='text-sm text-muted-foreground mb-2'>Or enter this secret manually:</p>
                                    <div className='bg-muted p-2 rounded font-mono text-xs break-all'>
                                        {newTotpSecret}
                                    </div>
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor='totp-verification-code'>Verification Code</Label>
                                    <Input
                                        id='totp-verification-code'
                                        type='text'
                                        placeholder='Enter 6-digit code'
                                        value={totpVerificationCode}
                                        onChange={(e) => setTotpVerificationCode(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                <div className='flex gap-2'>
                                    <Button onClick={handleVerifyNewTotp} disabled={isTotpLoading || totpVerificationCode.length !== 6}>
                                        {isTotpLoading ? "Verifying..." : "Verify & Complete Setup"}
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        setShowTotpSetup(false);
                                        setNewTotpQrCode(null);
                                        setNewTotpSecret(null);
                                        setNewFactorId(null);
                                        setTotpVerificationCode("");
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>

        </div>
    )
}
