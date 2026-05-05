"use client";

import { Button } from './ui/button'
import { startOnboardPaypal } from '@/lib/payments/paypal/onboardPaypal';
import { isOnBoarded } from '@/lib/payments/paypal/isOnBoarded';
import { useEffect, useState } from 'react';

const OnboardingBtn = ({ content }: { content: string }) => {
    const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    // const isSellerOnBoarded : boolean;

    // const onboarded = async () => {
    //   isSellerOnBoarded = await isOnBoarded();
    // }

    const setup = async () => {
        console.log("User Onboarded: " + await isOnBoarded());
        setLoading(true)
        try {
            // get onboard link
            const result = await startOnboardPaypal();

            if (result.success && result.onboardingURL) {
                setOnboardingUrl(`${result.onboardingURL}&displayMode=minibrowser`)
            } else {
                alert(result.error || "failed to start onboarding")
            }
        } catch (err) {
            alert("Error starting onboarding")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setup();
        // Load the PayPal partner.js script dynamically (sandbox or live)
        const script = document.createElement('script');
        script.src = "https://www.sandbox.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js";
        script.id = "paypal-js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup
            document.body.removeChild(script);
        };
    }, []);


    return (
        <div>
            <a
                data-paypal-button="true"
                href={onboardingUrl || ""}
                target="PPFrame"
            // Optional: data-paypal-onboard-complete="yourCallbackFunction"
            >
                <Button variant="red_default" disabled={loading}>
                    {loading ? "Loading..." : content}
                </Button>
            </a>
        </div>
    )
}

export default OnboardingBtn
