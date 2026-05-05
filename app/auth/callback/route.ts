"use server";

import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    console.log("CODE: ", code)
    // if "next" is in param, use it as the redirect URL
    let next = searchParams.get('next') ?? '/'
    if (!next.startsWith('/')) {
        // if "next" is not a relative URL, use the default
        next = '/'
    }

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                console.log(isLocalEnv)
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                console.log(forwardedHost)
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                console.log(origin, " ||| ", next)
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
        console.log(error);
    }

    

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/error`)
}