"use client";

import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { ReactNode, Suspense, useContext, useEffect, useState } from "react";
import { createContext } from "react";

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children, initialSession}:{
    children: ReactNode
    initialSession?: Session | null
}) {
    const [session, setSession] = useState<Session | null>(initialSession ?? null);
    const [loading, setLoading] = useState(!initialSession);

    useEffect(()=>{
        const supabase = createClient();

        // Get session then set session and loading

        supabase.auth.getSession().then(
            ({data: { session }
            })=>{
            setSession(session);
            setLoading(false);
        })

        // listen for changes

        const { data : listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setLoading(false);
        })

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // pack the freshly set session and user and the if loading values

    const value = {
        session,
        user: session?.user ?? null,
        loading
    };

    // return children packed with the context

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () =>{
    const context= useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};
