import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { product_id: string } }
) {
    const productId = (await params).product_id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
        return NextResponse.json({
            isInCart: false,
            isFavorite: false,
            isOwner: false,
            isLoggedIn: false
        });
    }

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

            // User is actual owner if they created the product (seller)
            const isOwner = !!ownedProduct;

            // User has purchased the product (buyer)
            const hasPurchased = !!purchase;

            return NextResponse.json({
                isInCart: !!cartItem,
                isFavorite: !!favorite,
                isOwner,
                hasPurchased,
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
