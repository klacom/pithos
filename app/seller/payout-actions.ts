'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { createAudit } from '@/lib/supabase/create-audit'

export type PayoutMethod = {
    id?: string
    method_type: 'gcash' | 'maya' | 'bank'
    account_name: string
    account_number: string
    is_primary: boolean
}

export async function getPayoutMethods() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // console.log('User:', user)

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('seller_payout_methods')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: true })

    console.log('Loaded payout methods:', data)

    if (error) throw error

    return data.map((method: any) => ({
        ...method,
        account_number: decrypt(method.account_number)
    })) as PayoutMethod[]
}

export async function savePayoutMethod(method: PayoutMethod) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const payload = {
        seller_id: user.id,
        method_type: method.method_type,
        account_name: method.account_name,
        account_number: encrypt(method.account_number),
        is_primary: method.is_primary,
        updated_at: new Date().toISOString()
    }

    if (method.id) {
        // If this is set as primary, unset others
        if (method.is_primary) {
            await supabase
                .from('seller_payout_methods')
                .update({ is_primary: false })
                .eq('seller_id', user.id)
        }

        const { error } = await supabase
            .from('seller_payout_methods')
            .update(payload)
            .eq('id', method.id)
            .eq('seller_id', user.id)

        if (error) throw error
    } else {
        // If this is the first method or set as primary
        const { count } = await supabase
            .from('seller_payout_methods')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', user.id)

        if (count === 0) {
            payload.is_primary = true
        } else if (method.is_primary) {
            await supabase
                .from('seller_payout_methods')
                .update({ is_primary: false })
                .eq('seller_id', user.id)
        }

        const { error } = await supabase
            .from('seller_payout_methods')
            .insert([payload])

        if (error) throw error
    }

    await createAudit({
        action_name: method.id ? 'UPDATE_PAYOUT_METHOD' : 'ADD_PAYOUT_METHOD',
        action_description: `${method.id ? 'Updated' : 'Added'} ${method.method_type} account for seller`,
        actor: user.id
    })

    revalidatePath('/seller/payout-settings')
    return { success: true }
}

export async function deletePayoutMethod(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data: methodToDelete, error: loadErr } = await supabase
        .from('seller_payout_methods')
        .select('is_primary, method_type')
        .eq('id', id)
        .eq('seller_id', user.id)
        .maybeSingle()

    if (loadErr) throw loadErr
    if (!methodToDelete) {
        throw new Error('Payout method not found.')
    }

    const payoutType = String(methodToDelete.method_type ?? '')
        .trim()
        .toLowerCase()
    // Only the primary GCash method is payout-critical for this rule; extra (non-primary)
    // GCash rows can be removed even when the seller still has listings.
    const isPrimary = methodToDelete.is_primary === true
    if (payoutType === 'gcash' && isPrimary) {
        // Use service role so the count is not hidden by RLS on `products` (user-scoped
        // queries can return 0 rows even when the seller owns listings).
        // Archived-only catalog does not block removal (matches "archive first" copy).
        const admin = createAdminClient()
        const { count, error: countErr } = await admin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_owner_id', user.id)
            .or('product_status.eq.draft,product_status.eq.published,product_status.is.null')

        if (countErr) throw countErr
        if (count != null && count > 0) {
            throw new Error(
                'You cannot remove your primary GCash payout while you have draft or published listings. Set another method as primary, or archive or delete those assets first.',
            )
        }
    }

    const { error } = await supabase
        .from('seller_payout_methods')
        .delete()
        .eq('id', id)
        .eq('seller_id', user.id)

    if (error) throw error

    // If we deleted the primary method, set another one as primary if available
    if (methodToDelete?.is_primary) {
        const { data: nextMethod } = await supabase
            .from('seller_payout_methods')
            .select('id')
            .eq('seller_id', user.id)
            .limit(1)
            .single()

        if (nextMethod) {
            await supabase
                .from('seller_payout_methods')
                .update({ is_primary: true })
                .eq('id', nextMethod.id)
        }
    }

    await createAudit({
        action_name: 'DELETE_PAYOUT_METHOD',
        action_description: `Deleted payout method ${id}`,
        actor: user.id
    })

    revalidatePath('/seller/payout-settings')
    return { success: true }
}
