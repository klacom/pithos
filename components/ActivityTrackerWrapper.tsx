"use client";

import { useAuth } from "@/components/AuthProvider";
import ActivityTracker from "./ActivityTracker"; 

export default function ActivityTrackerWrapper() {
    const { user } = useAuth();

    if (!user) {
        return null; // Do not render ActivityTracker if no user is authenticated
    }

    return <ActivityTracker />;
}