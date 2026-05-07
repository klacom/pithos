"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SessionPolicy = {
    role: string;
    timeout_minutes: number;
};

export type SystemConfig = {
    max_login_attempts: number;
    min_char_length: number;
    min_uppercase: number;
    min_lowercase: number;
    min_numbers: number;
    min_spec_chars: number;
};

/**
 * Fetches the session policies for all roles.
 * If no policies exist, it creates default ones.
 */
export async function getSessionPolicies() {
    const admin = createAdminClient();
    
    // 1. Try to fetch existing policies using the correct column 'role'
    const { data: existingData, error: fetchError } = await admin
        .from('session_policies')
        .select('role, timeout_minutes')
        .order('role');

    if (fetchError) {
        console.error("Error fetching session policies:", fetchError.message);
        return { data: null, error: fetchError.message };
    }

    // 2. If policies exist, return them
    if (existingData && existingData.length > 0) {
        return { data: existingData as SessionPolicy[], error: null };
    }

    // 3. If no policies exist, initialize with defaults
    console.log("No session policies found. Initializing defaults...");
    const defaultPolicies: SessionPolicy[] = [
        { role: "admin", timeout_minutes: 30 },
        { role: "seller", timeout_minutes: 30 },
        { role: "buyer", timeout_minutes: 30 },
    ];

    const { data: insertedData, error: insertError } = await admin
        .from('session_policies')
        .upsert(defaultPolicies, { onConflict: 'role' })
        .select();

    if (insertError) {
        console.error("Error initializing default session policies:", insertError.message);
        return { data: null, error: insertError.message };
    }

    return { data: insertedData as SessionPolicy[], error: null };
}

/**
 * Saves or updates a session policy for a specific role.
 */
export async function saveSessionPolicy(role: string, timeout_minutes: number) {
    const admin = createAdminClient();
    const { error } = await admin
        .from('session_policies')
        .upsert({ role, timeout_minutes }, { onConflict: 'role' });

    if (error) {
        console.error("Error saving session policy:", error.message);
        return { success: false, error: error.message };
    }
    return { success: true };
}

/**
 * Fetches the system configuration using the admin client.
 * Returns defaults if no configuration is found.
 */
export async function getSystemConfig() {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('system_configs')
        .select('max_login_attempts, min_char_length, min_uppercase, min_lowercase, min_numbers, min_spec_chars')
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching system configuration:", error.message || error.details);
        return { data: null, error: error.message };
    }

    return { data, error: null };
}

/**
 * Updates or creates the system configuration using the admin client.
 * Sanitizes input to ensure only specific columns are updated.
 */
export async function saveSystemConfig(newConfig: SystemConfig) {
    const admin = createAdminClient();

    // Sanitize the input to only include the specific columns
    // Enforce hard minimums on the server for security
    const sanitizedConfig = {
        max_login_attempts: Math.max(3, newConfig.max_login_attempts),
        min_char_length: Math.max(12, newConfig.min_char_length),
        min_uppercase: Math.max(1, newConfig.min_uppercase),
        min_lowercase: Math.max(1, newConfig.min_lowercase),
        min_numbers: Math.max(1, newConfig.min_numbers),
        min_spec_chars: Math.max(1, newConfig.min_spec_chars)
    };

    const { error } = await admin
        .from('system_configs')
        .upsert({
            id: 1, // Ensure we are always updating the single config record
            ...sanitizedConfig
        });

    if (error) {
        console.error("Save error:", error.message || error.details);
        return { success: false, error: error.message || "Unknown error occurred" };
    }

    return { success: true };
}
