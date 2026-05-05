import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        // MFA cleanup disabled - we want to preserve user MFA setups
        // This API is kept for compatibility but no longer removes factors
        return NextResponse.json({ 
            success: true, 
            message: "MFA cleanup disabled - factors preserved" 
        })

    } catch (err: any) {
        console.error("Cleanup MFA factors error:", err)
        return NextResponse.json(
            { error: err.message || "Cleanup failed" },
            { status: 500 }
        )
    }
}
