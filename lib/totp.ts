import { createClient } from '@/lib/supabase/client';

export interface TOTPEnrollmentData {
    factorId: string;
    qrCode: string;
    secret: string;
}

export async function enrollTOTP(): Promise<TOTPEnrollmentData> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `security-${Date.now()}`,
    });

    if (error || !data) {
        throw new Error('Failed to enroll TOTP: ' + error?.message);
    }

    return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
    };
}

export async function verifyTOTP(factorId: string, code: string): Promise<boolean> {
    const supabase = await createClient();

    // First challenge the factor
    const challenge = await supabase.auth.mfa.challenge({ factorId });

    if (challenge.error || !challenge.data?.id) {
        throw new Error('Failed to challenge TOTP: ' + challenge.error?.message);
    }

    // Then verify the code
    const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
    });

    if (verify.error) {
        return false;
    }

    return true;
}

export async function listAuthFactors(): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
        throw new Error('Failed to list auth factors: ' + error.message);
    }

    return data.all || [];
}

export async function getTOTPSecret(): Promise<string | null> {
    const supabase = await createClient();
    try {
        const factors = await listAuthFactors();
        const totpFactor = factors.find(factor => factor.factor_type === 'totp');

        if (!totpFactor) {
            return null;
        }

        // For security reasons, we can't retrieve the secret directly from Supabase
        // The secret is only available during enrollment
        // We'll need to store it in user metadata or a separate table

        const { data: { user } } = await supabase.auth.getUser();

        if (user?.user_metadata?.totp_secret) {
            return user.user_metadata.totp_secret;
        }

        return null;
    } catch (error) {
        console.error('Error getting TOTP secret:', error);
        return null;
    }
}

export async function saveTOTPSecret(factorId: string, secret: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        data: {
            totp_secret: secret,
            totp_factor_id: factorId,
        }
    });

    if (error) {
        throw new Error('Failed to save TOTP secret: ' + error.message);
    }
}
