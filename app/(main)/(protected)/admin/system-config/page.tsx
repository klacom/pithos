"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import InputTextField from "@/components/technical-components/InputTextField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSystemConfig, saveSystemConfig, SystemConfig, getSessionPolicies, saveSessionPolicy, SessionPolicy } from "./system-config-settings";

/**
 * System Configuration Page
 * This is the primary UI (front-end) for managing system-wide settings.
 * It uses Server Actions (system-config-settings.ts) to interact with the database.
 */
const Page = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policies, setPolicies] = useState<SessionPolicy[]>([]);
    const [config, setConfig] = useState<SystemConfig>({
        max_login_attempts: 3,
        min_char_length: 12,
        min_uppercase: 1,
        min_lowercase: 1,
        min_numbers: 1,
        min_spec_chars: 1
    });

    // Fetch initial configuration on load
    useEffect(() => {
        const fetchData = async () => {
            const [configRes, policiesRes] = await Promise.all([
                getSystemConfig(),
                getSessionPolicies()
            ]);

            if (configRes.error) {
                toast.error(`Error loading configuration: ${configRes.error}`);
            } else if (configRes.data) {
                setConfig(configRes.data);
            }

            if (policiesRes.error) {
                toast.error(`Error loading session policies: ${policiesRes.error}`);
            } else if (policiesRes.data) {
                setPolicies(policiesRes.data);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSaveAllPolicies = async () => {
        setSaving(true);
        try {
            const results = await Promise.all(
                policies.map(policy => saveSessionPolicy(policy.role, policy.timeout_minutes))
            );

            const allSuccess = results.every(res => res.success);
            if (allSuccess) {
                toast.success("All session policies updated successfully!");
            } else {
                toast.error("Some policies failed to update.");
            }
        } catch (error) {
            toast.error("An error occurred while saving policies.");
        } finally {
            setSaving(false);
        }
    };

    const handlePolicyChange = (role: string, value: string) => {
        const timeout = parseInt(value) || 0;
        setPolicies(prev => prev.map(p =>
            p.role === role ? { ...p, timeout_minutes: timeout } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Client-side Validations with Hard Minimums
            if (config.max_login_attempts < 3) {
                toast.error("Login attempts must be at least 3");
                setSaving(false);
                return;
            }
            if (config.min_char_length < 12) {
                toast.error("Password length must be at least 12");
                setSaving(false);
                return;
            }
            if (config.min_uppercase < 1 || config.min_lowercase < 1 ||
                config.min_numbers < 1 || config.min_spec_chars < 1) {
                toast.error("Password complexity rules must be at least 1");
                setSaving(false);
                return;
            }

            const result = await saveSystemConfig(config);

            if (result.success) {
                toast.success("System configuration saved successfully!");
            } else {
                toast.error(`Failed to save configuration: ${result.error}`);
            }
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("An unexpected error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === "number" ? parseInt(value) || 0 : value
        }));
    };

    if (loading) {
        return <div className="p-8">Loading configuration...</div>;
    }

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4'>

            {/* Header */}
            <div className="flex flex-row justify-between">
                <h1 className='font-bold text-3xl'>System Config</h1>
            </div>

            <hr />

            {/* Content Container */}
            <div className="flex flex-col gap-6 min-h-0 overflow-y-auto">
                <div className="flex flex-col gap-4 pt-4">
                    {/* Login and Password Section */}
                    <div className='flex gap-4 items-start'>
                        <div className='flex flex-col gap-4 w-1/4 sticky top-0 bg-primary-foreground border border-muted rounded-lg p-4'>
                            <h1 className='font-bold text-2xl'>Login and Password</h1>
                            <p>Customize the login and password constraints for a better security.</p>
                            <Button className='w-fit' onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>

                        <div className='flex flex-col gap-4 w-3/4'>
                            <div className='flex flex-col gap-4 w-full p-4 bg-primary-foreground border border-muted rounded-lg'>
                                <h2 className='font-semibold text-xl'>Constraints</h2>
                                <hr />
                                <div className="flex flex-col gap-4">
                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Maximum Login Attempts</p>
                                            <InputTextField
                                                name="max_login_attempts"
                                                type="number"
                                                value={config.max_login_attempts}
                                                onChange={handleChange}
                                                placeholder="Enter maximum login attempts"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Minimum of 3 Login Attempts only</p>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Minimum Character Length</p>
                                            <InputTextField
                                                name="min_char_length"
                                                type="number"
                                                value={config.min_char_length}
                                                onChange={handleChange}
                                                placeholder="Enter minimum password length"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Passwords must be at least 12 characters</p>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Capital Letters</p>
                                            <InputTextField
                                                name="min_uppercase"
                                                type="number"
                                                value={config.min_uppercase}
                                                onChange={handleChange}
                                                placeholder="Enter minimum capital letters"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Minimum of at least {config.min_uppercase} capital letter</p>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Small Letters</p>
                                            <InputTextField
                                                name="min_lowercase"
                                                type="number"
                                                value={config.min_lowercase}
                                                onChange={handleChange}
                                                placeholder="Enter minimum small letters"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Minimum of at least {config.min_lowercase} small letter</p>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Numbers</p>
                                            <InputTextField
                                                name="min_numbers"
                                                type="number"
                                                value={config.min_numbers}
                                                onChange={handleChange}
                                                placeholder="Enter minimum numbers"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Minimum of at least {config.min_numbers} number</p>
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Special Characters</p>
                                            <InputTextField
                                                name="min_spec_chars"
                                                type="number"
                                                value={config.min_spec_chars}
                                                onChange={handleChange}
                                                placeholder="Enter minimum special characters"
                                            />
                                            <p className='text-sm text-accent italic'>Note: Minimum of at least {config.min_spec_chars} special character</p>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Details Section */}
                    <div className='flex gap-4 items-start'>
                        <div className='flex flex-col gap-4 w-1/4 sticky top-0 bg-primary-foreground border border-muted rounded-lg p-4'>
                            <h1 className='font-bold text-2xl'>Company Details</h1>
                            <p>Update your company's contact information that appears in the footer.</p>
                            <Button className='w-fit' onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>

                        <div className='flex flex-col gap-4 w-3/4'>
                            <div className='flex flex-col gap-4 w-full p-4 bg-primary-foreground border border-muted rounded-lg'>
                                <h2 className='font-semibold text-xl'>Footer Information</h2>
                                <hr />
                                <div className="flex flex-col gap-4">
                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Support Email</p>
                                            <InputTextField
                                                name="support_email"
                                                type="email"
                                                value={config.support_email || ""}
                                                onChange={handleChange}
                                                placeholder="e.g. support@pithos.com"
                                            />
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Support Phone</p>
                                            <InputTextField
                                                name="support_phone"
                                                type="text"
                                                value={config.support_phone || ""}
                                                onChange={handleChange}
                                                placeholder="e.g. +1 234 567 890"
                                            />
                                        </div>
                                    </Card>

                                    <Card className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                        <div className='flex flex-col gap-1'>
                                            <p className='text-sm font-medium'>Office Location</p>
                                            <InputTextField
                                                name="support_location"
                                                type="text"
                                                value={config.support_location || ""}
                                                onChange={handleChange}
                                                placeholder="e.g. 123 Street, City, Country"
                                            />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Session Timeout Policies Section */}
                    <div className='flex gap-4 items-start'>
                        {/* Title */}
                        <div className='flex flex-col gap-4 w-1/4 sticky top-0 bg-primary-foreground border border-muted rounded-lg p-4'>
                            <h1 className='font-bold text-2xl'>Session Timeout</h1>
                            <p className="text-sm">Set the inactivity timeout (in minutes) for each user role. A warning will be shown efore expiration depending on the timeout duration (e.g 25 minutes if session timeout is 30 minutes).</p>
                            <Button className='w-fit' onClick={handleSaveAllPolicies} disabled={saving}>
                                {saving ? "Saving..." : "Save All Policies"}
                            </Button>
                        </div>

                        {/* Interactable Content */}
                        <div className='flex flex-col gap-4 w-3/4'>
                            <div className='flex flex-col gap-4 w-full p-4 bg-primary-foreground border border-muted rounded-lg'>
                                <h2 className='font-semibold flex gap-2 text-xl items-center'>Role Policies</h2>
                                <hr />
                                <div className="flex flex-col gap-4">
                                    {policies.map((policy) => (
                                        <Card key={policy.role} className="flex flex-col gap-4 p-4 border border-muted shadow-none bg-background/50">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="font-bold text-lg capitalize">{policy.role} Policy</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <h3 className="font-medium">Inactivity Timeout (Minutes)</h3>
                                                    <InputTextField
                                                        type="number"
                                                        min={1}
                                                        max={1440}
                                                        value={policy.timeout_minutes}
                                                        onChange={(e) => handlePolicyChange(policy.role, e.target.value)}
                                                        placeholder={`Enter minutes for ${policy.role}`}
                                                    />
                                                </div>
                                                <p className="text-sm text-accent">
                                                    Note: User will be warned when {
                                                        policy.timeout_minutes <= 1 ? "30 seconds" :
                                                            policy.timeout_minutes <= 5 ? "1 minute" :
                                                                policy.timeout_minutes <= 10 ? "5 minutes" :
                                                                    policy.timeout_minutes <= 20 ? "10 minutes" :
                                                                        policy.timeout_minutes <= 25 ? "20 minutes" :
                                                                            policy.timeout_minutes <= 30 ? "25 minutes" :
                                                                                "5 minutes"
                                                    } remains (at {
                                                        policy.timeout_minutes <= 1 ? "30 seconds" :
                                                            policy.timeout_minutes <= 5 ? `${policy.timeout_minutes - 1} ${policy.timeout_minutes - 1 === 1 ? 'minute' : 'minutes'}` :
                                                                policy.timeout_minutes <= 10 ? `${policy.timeout_minutes - 5} minutes` :
                                                                    policy.timeout_minutes <= 20 ? `${policy.timeout_minutes - 10} minutes` :
                                                                        policy.timeout_minutes <= 25 ? `${policy.timeout_minutes - 20} minutes` :
                                                                            policy.timeout_minutes <= 30 ? `${policy.timeout_minutes - 25} minutes` :
                                                                                `${policy.timeout_minutes - 5} minutes`
                                                    } of inactivity).
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                    {policies.length === 0 && (
                                        <p className="text-muted-foreground py-8 text-center italic">No role policies found in the database.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
