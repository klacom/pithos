import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()

        // List all factors for the user
        const { data: factors, error: listError } = await supabaseAdmin.auth.mfa.listFactors()
        if (listError) {
            console.error("Admin list factors error:", listError)
        }

        if (factors) {
            for (const factor of factors.all) {
                try {
                    await supabaseAdmin.auth.mfa.unenroll({ 
                        factorId: factor.id,
                    })
                } catch (deleteError) {
                    console.error("Admin unenroll factor error:", deleteError)
                }
            }
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error("Cleanup MFA factors error:", err)
        return NextResponse.json(
            { error: err.message || "Cleanup failed" },
            { status: 500 }
        )
    }
}
