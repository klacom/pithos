"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkTransactionStatus(transactionIds: string[]) {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("transactions")
        .select("transaction_id, status, product_id, products(product_name, price)")
        .in("transaction_id", transactionIds);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
