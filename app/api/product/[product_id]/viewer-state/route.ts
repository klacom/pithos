import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const productId = params.id;
    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    try {
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) {
            return NextResponse.json({
                isInCart: false,
                isFavorite: false,
                isOwner: false,
                isLoggedIn: false
            });
        }

        // Fetch cart, favorites, and ownership in parallel
        const [
            { data: cartItem },
            { data: favorite },
            { data: purchase }
        ] = await Promise.all([
            supabaseAdmin.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
            supabaseAdmin.from('favorites').select('*').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
            supabaseAdmin.from('transactions').select('*').eq('buyer_id', user.id).eq('product_id', productId).eq('status', 'completed').maybeSingle()
        ]);

        return NextResponse.json({
            isInCart: !!cartItem,
            isFavorite: !!favorite,
            isOwner: !!purchase,
            isLoggedIn: true
        });

    } catch (error: any) {
        console.error('Viewer State Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
