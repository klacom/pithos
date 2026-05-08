import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { product_id: string } }
) {
    const productId = (await params).product_id;

    console.log("Product ID: ", productId);

    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    try {
        const { data } = await supabaseServer.auth.getUser();
        const user = data?.user;

        // console.log("Data: ", data);

        if (!user) {
            return NextResponse.json({
                isInCart: false,
                isFavorite: false,
                isOwner: false,
                isLoggedIn: false
            });
        }

        try {
            // Run all queries in parallel
            const { data: cartItem } = await supabaseAdmin
                .from('cart')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            console.log("Cart Item: ", cartItem);

            const { data: favorite } = await supabaseAdmin
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            console.log("Favorite: ", favorite);

            const { data: ownedProduct } = await supabaseAdmin
                .from('products')
                .select('product_id')
                .eq('product_id', productId)
                .eq('seller_owner_id', user.id)
                .maybeSingle();

            console.log("Owned Product: ", ownedProduct);

            // console.log({
            //     userId: user.id,
            //     productId,
            // });

            const { data: purchase } = await supabaseAdmin
                .from('transactions')
                .select('transaction_id')
                .eq('buyer_id', user.id)
                .eq('product_id', productId)
                .eq('status', 'completed')
                .maybeSingle();

            console.log("Purchase: ", purchase);

            // User owns product if:
            // - they created it
            // OR
            // - they purchased it
            const isOwner = !!ownedProduct || !!purchase;

            return NextResponse.json({
                isInCart: !!cartItem,
                isFavorite: !!favorite,
                isOwner,
                isLoggedIn: true
            });
        } catch (error) {
            console.error('Error fetching viewer state:', error);
            return NextResponse.json(
                { error: error as string },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Viewer State Error:', error);

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}