"use client";

import { useAuth } from "@/components/AuthProvider";
import ActivityTracker from "./ActivityTracker"; 
import { Suspense } from "react";

export default function ActivityTrackerWrapper() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <ActivityTracker />
        </Suspense>
    );
}