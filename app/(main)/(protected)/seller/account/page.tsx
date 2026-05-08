"use client";

import { useState, useEffect } from "react";
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { changePassword } from './actions'
import { toast } from "sonner"
import { validatePassword } from "@/lib/auth/password-rules";
import { getSystemConfig } from "@/app/(main)/(protected)/admin/system-config/system-config-settings";

const page = () => {
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
        setNewPassword(value);
        const errors = validatePassword(value, rules);
        setPasswordErrors(errors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

        setIsLoading(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                toast.success("Password changed successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(result.error || "Failed to change password");
            }
        } catch (error) {
            toast.error("An error occurred while changing your password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'>
            <div className='flex flex-col gap-2'>
                <h1 className='font-bold text-3xl'>Account Settings</h1>
                <p className='text-muted-foreground'>Manage your seller profile, store details, and payment methods.</p>
            </div>
            <hr />

            {/* Store Profile Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Store Profile</h1>
                    <p className='text-muted-foreground'>Update your stores public information and how buyers see you.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='store-name'>Store Name</Label>
                            <Input id='store-name' placeholder='Your awesome store name' defaultValue="Lark's Digital Assets" />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='seller-email'>Contact Email</Label>
                            <Input id='seller-email' type='email' placeholder='Email for buyers to reach you' defaultValue="larkirk@gmail.com" />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='store-bio'>Store Bio / Description</Label>
                            <Textarea id='store-bio' placeholder='Tell buyers about what you create...' rows={4} defaultValue="Creating high quality 2D and 3D assets for indie game developers." />
                        </div>

                        <div className='flex justify-end'>
                            <Button variant='red_default'>Save Changes</Button>
                        </div>
                    </Card>
                </div>
            </div>

            <hr />


            {/* Change Password Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='flex flex-col gap-4 w-full lg:w-1/4'>
                    <h1 className='font-bold text-2xl'>Change Password</h1>
                    <p className='text-muted-foreground'>Update your password to keep your account secure.</p>
                </div>
                <div className='flex flex-col gap-4 w-full lg:w-3/4'>
                    <Card className='w-full p-6 flex flex-col gap-6 bg-primary-foreground border-muted'>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                            <div className='flex justify-end'>
                                <Button type='submit' variant='red_default' disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Change Password"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>

        </div>
    )
}

export default page
