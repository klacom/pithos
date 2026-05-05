"use client";

import { useEffect, useState } from "react";

export default function ActivityTracker() {
    const [isInactive, setIsInactive] = useState(false);

    useEffect(() => {
        let lastActivity = Date.now();
        const events = ["mousemove", "keydown", "click", "scroll"];
        let throttleTimer: ReturnType<typeof setTimeout> | null = null;

        const updateActivity = () => {
            lastActivity = Date.now();
            
            // Only update state if we are currently inactive
            // and use a small throttle for the mousemove events
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    setIsInactive(false);
                    throttleTimer = null;
                }, 1000); // Throttle to once per second
            }
        };

        const handleActivity = () => {
            updateActivity();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        const interval = setInterval(async () => {
            // Only ping if user was recently active (last 1 min)
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastActivity < 60000
            ) {
                try {
                    const response = await fetch("/api/heartbeat", { method: "POST" });
                    if (response.status === 401) {
                        setIsInactive(true);
                    }
                } catch (err) {
                    console.error("Heartbeat failed", err);
                }
            }
        }, 30000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, []); // Run once on mount

    return (
        <>
            {isInactive && (
                <div
                    style={{
                        position: "fixed",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "red",
                        color: "white",
                        padding: "10px",
                        borderRadius: "5px",
                        zIndex: 1000,
                    }}
                >
                    You have been logged out due to inactivity.
                </div>
            )}
        </>
    );
}