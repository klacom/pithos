"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Clock, LogOut } from "lucide-react";

export default function ActivityTracker() {
    const router = useRouter();
    const lastActivityRef = useRef(Date.now());
    const [isInactive, setIsInactive] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [timeoutMinutes, setTimeoutMinutes] = useState(2);
    const [warningMinutes, setWarningMinutes] = useState(1);
    const hasWarnedRef = useRef(false);

    // Calculate idle time for the UI
    const [minutesIdle, setMinutesIdle] = useState(0);

    useEffect(() => {
        const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
        
        const handleActivity = () => {
            // Only update activity if we aren't currently showing a warning.
            // This ensures the user MUST click the button to stay logged in,
            // otherwise the background timer keeps ticking towards the logout.
            if (!showWarning && !isInactive) {
                lastActivityRef.current = Date.now();
                setMinutesIdle(0);
            }
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

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
                    // Force refresh to clear state and show modal
                    router.refresh();
                }
                return;
            }

            // 2. Check for warning threshold
            if (currentMinutesIdle >= warningMinutes && !hasWarnedRef.current && !isInactive) {
                setShowWarning(true);
                hasWarnedRef.current = true;
                toast.warning(`Inactivity Warning: You will be logged out soon.`, {
                    duration: 10000,
                    description: "Move your mouse or type to stay logged in."
                });
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
                    console.debug("Heartbeat failed:", err);
                }
            }
        }, 20000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(heartbeatInterval);
        };
    }, [router, timeoutMinutes, warningMinutes, isInactive, showWarning]);

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
                            <span className="mx-1 font-bold text-accent">{Math.ceil(timeoutMinutes - minutesIdle)} minutes</span> 
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

            {/* Final Logout Dialog */}
            <AlertDialog open={isInactive}>
                <AlertDialogContent className="border-destructive/50 bg-background shadow-2xl backdrop-blur-none max-w-md">
                    <AlertDialogHeader className="gap-3">
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive font-bold text-2xl">
                            <AlertCircle className="h-7 w-7" />
                            Session Expired
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-lg leading-relaxed text-foreground">
                            Your session has expired and you&apos;ve been logged out due to inactivity for 
                            <span className="mx-1 font-bold text-accent">{timeoutMinutes} minutes</span>.
                            This is done to keep your account secure.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogAction 
                            className="h-14 w-full gap-2 rounded-xl bg-accent text-accent-foreground text-xl font-bold shadow-xl shadow-accent/20 transition-all hover:scale-[1.01] active:scale-[0.99] hover:bg-accent/90"
                            onClick={() => {
                                window.location.href = "/auth/login";
                            }}
                        >
                            <LogOut className="h-6 w-6" />
                            Sign In to Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}