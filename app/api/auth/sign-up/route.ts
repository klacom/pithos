import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePassword } from '@/lib/auth/password-rules';

export async function POST(request: NextRequest) {
    try {
        const { email, password, captchaToken } = await request.json();

        const verifyRes = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captchaToken}`,
            }
        );

        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            return NextResponse.json(
                { status: "error", message: "Captcha failed" },
                { status: 400 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { status: 'error', message: 'Missing fields.' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const adminSupabase = createAdminClient();
        const { data: existingUsers, error: userLookupError } = await adminSupabase.auth.admin.listUsers();
        
        if (!userLookupError) {
            const userExists = existingUsers.users.some(u => u.email === email);
            if (userExists) {
                return NextResponse.json(
                    { status: 'error', message: 'User already registered.' },
                    { status: 400 }
                );
            }
        }

        // Password complexity check
        const supabase = await createClient();

        // Fetch rules from DB
        const { data: config } = await supabase
            .from('system_configs')
            .select('*')
            .single();

        const errors = validatePassword(password, config || undefined);

        if (errors.length > 0) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: `Password must contain: ${errors.join(', ')}.`,
                },
                { status: 400 }
            );
        }


        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${request.nextUrl.origin}/auth/login`,
            }
        });

        if (error) {
            return NextResponse.json(
                { status: 'error', message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ status: 'ok', user_id: data.user?.id });
    } catch (error) {
        console.error('Sign up error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal server error' },
            { status: 500 }
        );
    }
}