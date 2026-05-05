"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error(error);
      return;
    }
    
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    if (factorsData && factorsData.totp.length > 0) {
      const activeFactor = factorsData.totp.find((factor) => factor.status === 'verified');
      if (activeFactor) {
        setIsEnabled(true);
      }
    }
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Note: We no longer automatically unenroll unverified factors
      // to preserve MFA setup for users

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });

      if (verify.error) throw verify.error;

      setSuccess("MFA has been successfully enabled!");
      setIsEnabled(true);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setIsLoading(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData && factorsData.totp.length > 0) {
        for (const factor of factorsData.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      setIsEnabled(false);
      setSuccess("MFA has been disabled.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication (MFA)</CardTitle>
        <CardDescription>
          Secure your account using a TOTP authenticator app like Google Authenticator.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {isEnabled ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              MFA is currently enabled for your account.
            </p>
            <Button variant="destructive" onClick={handleUnenroll} disabled={isLoading}>
              Disable MFA
            </Button>
          </div>
        ) : !qrCode ? (
          <Button onClick={handleEnroll} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Enable MFA"}
          </Button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-center">
                Scan this QR code with your authenticator app (e.g. Google Authenticator).
              </p>
              {/* Render the QR code SVG correctly */}
              <div className="w-48 h-48 bg-white p-2 rounded-md flex items-center justify-center">
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  className="w-full h-full"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-primary hover:underline"
                >
                  {showSecret ? "Hide secret key" : "Can't scan? Show secret key"}
                </button>
                {showSecret && (
                  <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all max-w-[200px] text-center">
                    {secret}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="verifyCode">Verification Code</Label>
              <Input
                id="verifyCode"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button onClick={handleVerify} disabled={isLoading || verifyCode.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
