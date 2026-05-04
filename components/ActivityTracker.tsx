"use client";

import { useEffect, useState } from "react";

export default function ActivityTracker() {
    const [isInactive, setIsInactive] = useState(false);

    useEffect(() => {
        let lastActivity = Date.now();

        const events = ["mousemove", "keydown", "click", "scroll"];

        const updateActivity = () => {
            lastActivity = Date.now();
            if (isInactive) setIsInactive(false); // Reset inactivity state on user activity
        };

        events.forEach((event) => {
            window.addEventListener(event, updateActivity);
        });

        // window.addEventListener("blur", () => {
        //     lastActivity = 0;
        // });

        // if (document.hidden) return;

        const interval = setInterval(async () => {
            // Only ping if user was recently active (last 1 min)
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastActivity < 60000
            ) {
                const response = await fetch("/api/heartbeat", { method: "POST" });
                if (response.status === 401) {
                    setIsInactive(true); // User is logged out due to inactivity
                }
            }
        }, 30000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, updateActivity);
            });
            clearInterval(interval);
        };
    }, [isInactive]);

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