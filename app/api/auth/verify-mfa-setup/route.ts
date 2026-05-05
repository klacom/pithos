import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const { email, password, mfaCode, factorId } = await request.json();

        if (!email || !password || !mfaCode || !factorId) {
            return NextResponse.json(
                { status: 'error', message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const adminSupabase = createAdminClient();

        // Sign in the user to get a session for MFA verification
        const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.error('Error signing in user for MFA verification:', signInError);
            return NextResponse.json(
                { status: 'error', message: 'Invalid credentials' },
                { status: 400 }
            );
        }

        // Challenge the MFA factor
        const challenge = await adminSupabase.auth.mfa.challenge({ factorId });

        if (challenge.error || !challenge.data?.id) {
            console.error('MFA Challenge failed:', challenge.error);
            return NextResponse.json(
                { status: 'error', message: 'Failed to challenge MFA factor' },
                { status: 500 }
            );
        }

        // Verify the MFA code
        const verify = await adminSupabase.auth.mfa.verify({
            factorId,
            challengeId: challenge.data.id,
            code: mfaCode,
        });

        if (verify.error) {
            console.error('MFA Verification failed:', verify.error);
            return NextResponse.json(
                { status: 'error', message: 'Invalid verification code' },
                { status: 400 }
            );
        }

        // Sign out the user after successful verification
        await adminSupabase.auth.signOut();

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('MFA verification error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal server error' },
            { status: 500 }
        );
    }
}
