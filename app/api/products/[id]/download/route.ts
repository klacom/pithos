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
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify ownership
        const { data: purchase } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('buyer_id', user.id)
            .eq('product_id', productId)
            .eq('status', 'completed')
            .maybeSingle();

        if (!purchase) {
            return NextResponse.json({ error: 'You do not own this product' }, { status: 403 });
        }

        // Get file names from storage
        const { data: files, error: filesErr } = await supabaseAdmin.storage
            .from('assets_storage')
            .list(productId);

        if (filesErr || !files || files.length === 0) {
            return NextResponse.json({ error: 'No files found for this product' }, { status: 404 });
        }

        // For now, download the first file. In a real app, you might want to zip them.
        const fileName = files[0].name;
        const { data, error } = await supabaseAdmin.storage
            .from('assets_storage')
            .createSignedUrl(`${productId}/${fileName}`, 60); // 60 seconds expiry

        if (error) throw error;

        return NextResponse.json({ downloadUrl: data.signedUrl, fileName });

    } catch (error: any) {
        console.error('Download Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
