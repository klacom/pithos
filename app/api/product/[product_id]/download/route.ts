import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ASSETS_STORAGE_BUCKET } from '@/lib/seller/asset-package-storage';
import { NextRequest, NextResponse } from 'next/server';

function pickMainPackageFile(
    files: { name: string; metadata?: Record<string, unknown> | null }[],
): string | null {
    const real = files.filter((f) => f.name?.trim());
    if (real.length === 0) return null;
    const archiveRe = /\.(zip|rar|7z|tar\.gz|tgz|blend|fbx|obj|glb|gltf|usd|usdz)(\.|$)/i;
    const scored = [...real].sort((a, b) => {
        const sa = Number(a.metadata?.size ?? 0);
        const sb = Number(b.metadata?.size ?? 0);
        if (sb !== sa) return sb - sa;
        const ba = archiveRe.test(a.name) ? 1 : 0;
        const bb = archiveRe.test(b.name) ? 1 : 0;
        return bb - ba;
    });
    return scored[0]?.name ?? null;
}

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

        const { data: files, error: filesErr } = await supabaseAdmin.storage
            .from(ASSETS_STORAGE_BUCKET)
            .list(productId, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' },
            });

        if (filesErr || !files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files found for this product' },
                { status: 404 }
            );
        }

        const fileName = pickMainPackageFile(files);
        if (!fileName) {
            return NextResponse.json(
                { error: 'No files found for this product' },
                { status: 404 }
            );
        }

        const { data, error } = await supabaseAdmin.storage
            .from(ASSETS_STORAGE_BUCKET)
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