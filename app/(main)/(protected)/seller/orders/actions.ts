"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SellerOrderBuyer = {
    id: string;
    user_fullname: string | null;
    user_email: string | null;
    created_at: string | null;
    user_role: string | null;
};

export type SellerOrderProduct = {
    product_id: string;
    product_name: string;
    price: number;
};

export type SellerOrderRow = {
    transaction_id: string;
    buyer_id: string;
    product_id: string;
    created_at: string;
    status: string;
    buyer: SellerOrderBuyer | null;
    product: SellerOrderProduct | null;
};

export async function getSellerOrders(): Promise<{
    success: boolean;
    error?: string;
    data: SellerOrderRow[];
}> {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const uid = claimsData?.claims?.sub;
    if (!uid) {
        return { success: false, error: "Not signed in", data: [] };
    }

    const { data: products, error: productsError } = await supabase
        .from("products")
        .select("product_id, product_name, price")
        .eq("seller_owner_id", uid);

    if (productsError) {
        console.error("getSellerOrders products:", productsError);
        return { success: false, error: productsError.message, data: [] };
    }

    const productRows = products ?? [];
    const productIds = productRows.map((p) => p.product_id).filter(Boolean);
    if (productIds.length === 0) {
        return { success: true, data: [] };
    }

    let transactions: Record<string, unknown>[] | null = null;
    const { data: txUser, error: txUserErr } = await supabase
        .from("transactions")
        .select("*")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

    if (!txUserErr && txUser) {
        transactions = txUser as Record<string, unknown>[];
    } else {
        if (txUserErr) {
            console.warn(
                "getSellerOrders transactions (user client):",
                txUserErr.message,
            );
        }
        const { data: txAdmin, error: txAdminErr } = await admin
            .from("transactions")
            .select("*")
            .in("product_id", productIds)
            .order("created_at", { ascending: false });

        if (txAdminErr) {
            console.error("getSellerOrders transactions (admin):", txAdminErr);
            return { success: false, error: txAdminErr.message, data: [] };
        }
        transactions = (txAdmin ?? []) as Record<string, unknown>[];
    }

    const buyerIds = [
        ...new Set(
            (transactions ?? [])
                .map((t) => t.buyer_id as string)
                .filter(Boolean),
        ),
    ];

    let buyers: SellerOrderBuyer[] = [];
    if (buyerIds.length > 0) {
        const { data: buyersUser, error: buyersErr } = await supabase
            .from("users")
            .select("id, user_fullname, user_email, created_at, user_role")
            .in("id", buyerIds);

        if (!buyersErr && buyersUser) {
            buyers = buyersUser as SellerOrderBuyer[];
        } else {
            if (buyersErr) {
                console.warn("getSellerOrders buyers (user client):", buyersErr.message);
            }
            const { data: buyersAdmin, error: buyersAdminErr } = await admin
                .from("users")
                .select("id, user_fullname, user_email, created_at, user_role")
                .in("id", buyerIds);

            if (buyersAdminErr) {
                console.error("getSellerOrders buyers (admin):", buyersAdminErr);
            } else {
                buyers = (buyersAdmin ?? []) as SellerOrderBuyer[];
            }
        }
    }

    const byBuyer = new Map(buyers.map((b) => [b.id, b]));
    const byProduct = new Map(
        productRows.map((p) => [
            p.product_id,
            {
                product_id: p.product_id,
                product_name: p.product_name,
                price: Number(p.price),
            } satisfies SellerOrderProduct,
        ]),
    );

    const data: SellerOrderRow[] = (transactions ?? []).map((t) => {
        const productId = String(t.product_id ?? "");
        const buyerId = String(t.buyer_id ?? "");
        return {
            transaction_id: String(t.transaction_id ?? ""),
            buyer_id: buyerId,
            product_id: productId,
            created_at: String(t.created_at ?? ""),
            status: String(t.status ?? ""),
            buyer: byBuyer.get(buyerId) ?? null,
            product: byProduct.get(productId) ?? null,
        };
    });

    return { success: true, data };
}
