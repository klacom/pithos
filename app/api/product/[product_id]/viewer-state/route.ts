import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ product_id: string }> }
) {
    const { product_id: productId } = await params;

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
            const { data: cartItem, error: cartError } = await supabaseAdmin
                .from('cart')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle()

            console.log("Cart Item: ", cartItem);
            if (cartError) {
                console.error("Cart Error: ", cartError);
            }


            const { data: favorite, error: favoriteError } = await supabaseAdmin
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            console.log("Favorite: ", favorite);
            if (favoriteError) {
                console.error("Favorite Error: ", favoriteError);
            }


            const { data: ownedProduct, error: ownedProductError } = await supabaseAdmin
                .from('products')
                .select('product_id')
                .eq('product_id', productId)
                .eq('seller_owner_id', user.id)
                .maybeSingle()

            console.log("Owned Product: ", ownedProduct);
            if (ownedProductError) {
                console.error("Owned Product Error: ", ownedProductError);
            }


            // console.log({
            //     userId: user.id,
            //     productId,
            // });

            const { data: purchase, error: purchaseError } = await supabaseAdmin
                .from('transactions')
                .select('transaction_id')
                .eq('buyer_id', user.id)
                .eq('product_id', productId)
                .eq('status', 'completed')
                .maybeSingle();

            console.log("Purchase: ", purchase);
            if (purchaseError) {
                console.error("Purchase Error: ", purchaseError);
            }

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
