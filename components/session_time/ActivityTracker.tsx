"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

export default function ActivityTracker() {
    const router = useRouter();
    const lastActivityRef = useRef(Date.now());
    const [isInactive, setIsInactive] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [timeoutMinutes, setTimeoutMinutes] = useState(30);
    const [warningMinutes, setWarningMinutes] = useState(25);
    const hasWarnedRef = useRef(false);
    const [isCheckingInitial, setIsCheckingInitial] = useState(true);

    // Calculate idle time for the UI
    const [minutesIdle, setMinutesIdle] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    // Countdown effect for the warning modal
    useEffect(() => {
        if (!showWarning) return;

        const interval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            const currentMinutesIdle = timeSinceLastActivity / 60000;
            setMinutesIdle(currentMinutesIdle);
            
            const totalSecondsLeft = (timeoutMinutes * 60) - (timeSinceLastActivity / 1000);
            setRemainingSeconds(Math.max(0, Math.ceil(totalSecondsLeft)));

            if (totalSecondsLeft <= 0) {
                setIsInactive(true);
                setShowWarning(false);
                // Trigger auto-logout immediately
                window.location.href = "/auth/login?reason=timeout";
            }
        }, 100); // Update every 100ms for a perfectly smooth real-time countdown

        return () => clearInterval(interval);
    }, [showWarning, timeoutMinutes]);

    // Initial check to get real policy values immediately
    useEffect(() => {
        const fetchInitialPolicy = async () => {
            try {
                const response = await fetch("/api/heartbeat", { method: "POST" });
                const data = await response.json().catch(() => ({}));
                if (data.timeoutMinutes) setTimeoutMinutes(data.timeoutMinutes);
                if (data.warningMinutes) setWarningMinutes(data.warningMinutes);
                
                // If already timed out according to server
                if (response.status === 401) {
                    setIsInactive(true);
                }
            } catch (err) {
                console.debug("Initial heartbeat failed:", err);
            } finally {
                setIsCheckingInitial(false);
            }
        };
        fetchInitialPolicy();
    }, []);

    useEffect(() => {
        if (isCheckingInitial) return;

        const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
        
        const handleActivity = () => {
            if (!showWarning && !isInactive) {
                lastActivityRef.current = Date.now();
            }
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isCheckingInitial, showWarning, isInactive]);

    useEffect(() => {
        if (isCheckingInitial || isInactive) return;

        const heartbeatInterval = setInterval(async () => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            const currentMinutesIdle = timeSinceLastActivity / 60000;
            setMinutesIdle(currentMinutesIdle);

            // 1. Check for hard timeout
            if (currentMinutesIdle >= timeoutMinutes) {
                if (!isInactive) {
                    setIsInactive(true);
                    setShowWarning(false);
                    await fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
                    // Auto-redirect to login with a signal parameter
                    window.location.href = "/auth/login?reason=timeout";
                }
                return;
            }

            // 2. Check for warning threshold
            if (currentMinutesIdle >= warningMinutes && !hasWarnedRef.current && !isInactive) {
                setShowWarning(true);
                hasWarnedRef.current = true;
            }

            // 3. Heartbeat sync
            if (document.visibilityState === "visible") {
                try {
                    const response = await fetch("/api/heartbeat", { method: "POST" });
                    const data = await response.json().catch(() => ({}));
                    
                    if (data.timeoutMinutes) setTimeoutMinutes(data.timeoutMinutes);
                    if (data.warningMinutes) setWarningMinutes(data.warningMinutes);

                    if (response.status === 401) {
                        setIsInactive(true);
                        setShowWarning(false);
                        router.refresh();
                    }
                } catch (err) {
                    // Silently fail
                }
            }
        }, 20000);

        return () => clearInterval(heartbeatInterval);
    }, [isCheckingInitial, isInactive, timeoutMinutes, warningMinutes, router]);

    return (
        <>
            {/* Warning Dialog */}
            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent className="border-border bg-background shadow-2xl max-w-md">
                    <AlertDialogHeader className="gap-3">
                        <AlertDialogTitle className="flex items-center gap-2 text-accent text-2xl font-bold">
                            <Clock className="h-6 w-6" />
                            Inactivity Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-lg leading-relaxed text-foreground">
                            You have been inactive for a while. For your security, you will be automatically logged out in 
                            <span className="mx-1 font-bold text-accent">
                                {remainingSeconds < 60 
                                    ? `${remainingSeconds} seconds` 
                                    : `${Math.ceil(remainingSeconds / 60)} minutes`
                                }
                            </span> 
                            unless you click the button below to stay logged in.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogAction 
                            className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all text-lg font-bold shadow-lg shadow-accent/20"
                            onClick={() => {
                                setShowWarning(false);
                                hasWarnedRef.current = false;
                                lastActivityRef.current = Date.now();
                            }}
                        >
                            Stay Logged In
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}