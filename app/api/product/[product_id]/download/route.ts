import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ product_id: string }> }
) {
    const { product_id: productId } = await params;

    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();

    try {
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user purchased the product
        const { data: purchase } = await supabaseAdmin
            .from('transactions')
            .select('transaction_id')
            .eq('buyer_id', user.id)
            .eq('product_id', productId)
            .eq('status', 'completed')
            .maybeSingle();

        // Check if user created the product
        const { data: ownedProduct } = await supabaseAdmin
            .from('products')
            .select('product_id')
            .eq('product_id', productId)
            .eq('seller_owner_id', user.id)
            .maybeSingle();

        // User can download if:
        // - they bought the product
        // OR
        // - they are the creator/seller
        const isOwner = !!purchase || !!ownedProduct;

        if (!isOwner) {
            return NextResponse.json(
                { error: 'You do not own this product' },
                { status: 403 }
            );
        }

        // Get files from storage
        const { data: files, error: filesErr } = await supabaseAdmin.storage
            .from('assets_storage')
            .list(productId);

        if (filesErr || !files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files found for this product' },
                { status: 404 }
            );
        }

        // Download first file
        const fileName = files[0].name;

        const { data, error } = await supabaseAdmin.storage
            .from('assets_storage')
            .createSignedUrl(`${productId}/${fileName}`, 60);

        if (error) throw error;

        return NextResponse.json({
            downloadUrl: data.signedUrl,
            fileName
        });

    } catch (error: any) {
        console.error('Download Error:', error);

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}