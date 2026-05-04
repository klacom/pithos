import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    const traceId = Date.now();
    console.log(`[${traceId}] --- Incoming Login Request ---`);

    try {
        const body = await request.json();
        const { email, password, captchaToken, mfaCode, factorId } = body;

        console.log(`[${traceId}] Payload received for:`, email);

        if (!email || !password) {
            console.warn(`[${traceId}] Validation failed: Missing email or password`);
            return NextResponse.json(
                { status: "error", message: "Missing fields." },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Check if already locked
        console.log(`[${traceId}] Checking account lock status via RPC...`);
        const { data: isLocked, error: lockCheckError } = await supabase.rpc("check_account_locked", {
            login_email: email,
        });

        if (lockCheckError) {
            console.error(`[${traceId}] RPC 'check_account_locked' failed:`, lockCheckError);
        }

        if (isLocked) {
            console.warn(`[${traceId}] Login blocked: Account is locked.`);
            return NextResponse.json(
                { status: "error", message: "Account is locked. Please contact support." },
                { status: 403 }
            );
        }

        // 2. Attempt login
        console.log(`[${traceId}] Attempting signInWithPassword...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log(`[${traceId}] Auth error: ${error.message}. Incrementing failed attempts...`);
            const { data: status, error: rpcError } = await supabase.rpc("handle_failed_login", {
                login_email: email,
            });

            if (rpcError) console.error(`[${traceId}] RPC 'handle_failed_login' failed:`, rpcError);

            if (error.message.includes("Email not confirmed")) {
                return NextResponse.json(
                    { status: "error", message: "Please verify your email before logging in." },
                    { status: 400 }
                );
            }

            if (status?.is_locked) {
                console.warn(`[${traceId}] Account JUST locked due to too many attempts.`);
                return NextResponse.json(
                    { status: "error", message: `Account locked (${status.login_attempts} attempts).` },
                    { status: 403 }
                );
            }

            const attemptsLeft = status?.login_attempts
                ? Math.max(0, (status.max_attempts ?? 3) - status.login_attempts)
                : null;

            return NextResponse.json(
                {
                    status: "error",
                    message: attemptsLeft !== null
                        ? `Invalid credentials. ${attemptsLeft} attempt(s) left.`
                        : "Invalid credentials.",
                },
                { status: 400 }
            );
        }

        console.log(`[${traceId}] Initial login success. Checking MFA requirements...`);

        // 3. MFA Verification Flow
        if (mfaCode && factorId) {
            console.log(`[${traceId}] MFA Code detected. Verifying Turnstile...`);

            // if (!captchaToken) {
            //     console.warn(`[${traceId}] MFA attempted without Captcha Token.`);
            //     return NextResponse.json({ status: "error", message: "Captcha required." }, { status: 400 });
            // }

            // const captchaRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/x-www-form-urlencoded" },
            //     body: new URLSearchParams({
            //         secret: process.env.TURNSTILE_SECRET_KEY!,
            //         response: captchaToken,
            //     }),
            // });

            // const captchaData = await captchaRes.json();
            // if (!captchaData.success) {
            //     console.error(`[${traceId}] Turnstile verification failed:`, captchaData);
            //     return NextResponse.json({ status: "error", message: "Captcha failed." }, { status: 400 });
            // }

            // console.log(`[${traceId}] Captcha valid. Challenging MFA factor...`);
            const challenge = await supabase.auth.mfa.challenge({ factorId });

            if (!challenge.data?.id) {
                console.error(`[${traceId}] MFA Challenge failed to generate ID:`, challenge.error);
                return NextResponse.json({ status: "error", message: "MFA challenge failed" }, { status: 500 });
            }

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: mfaCode,
            });

            if (verify.error) {
                console.warn(`[${traceId}] MFA Verification code invalid:`, verify.error.message);
                return NextResponse.json({ status: "error", message: "Invalid MFA code" }, { status: 400 });
            }

            // console.log(`[${traceId}] MFA Verified. Unenrolling temporary factor and resetting attempts...`);
            // await supabase.auth.mfa.unenroll({ factorId });
            await supabase.rpc("reset_login_attempts", { login_email: email });

            return NextResponse.json({ status: "ok" });
        }

        // 4. MFA Enrollment Flow (If no code provided yet)
        console.log(`[${traceId}] No MFA code provided. Starting new MFA enrollment...`);
        const enroll = await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: `login-${Date.now()}`,
        });

        if (enroll.error) {
            console.error(`[${traceId}] MFA Enrollment Error:`, enroll.error);
            return NextResponse.json({ status: "error", message: "Failed to setup MFA" }, { status: 500 });
        }

        console.log(`[${traceId}] MFA Enrollment successful. Returning QR data.`);
        return NextResponse.json({
            status: "mfa_setup",
            factorId: enroll.data.id,
            qrCode: enroll.data.totp.qr_code,
            secret: enroll.data.totp.secret,
        });

    } catch (error: any) {
        // THIS IS THE MOST LIKELY PLACE FOR THE HTML ERROR
        console.error(`[${traceId}] CRITICAL CRASH:`, error);
        return NextResponse.json(
            { status: "error", message: "Internal server error", detail: error.message },
            { status: 500 }
        );
    }
}