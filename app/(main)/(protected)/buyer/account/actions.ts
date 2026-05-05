"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserName(fullName: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating user name:", error);
        return { success: false, error: error.message };
    }
}

export async function updateUserAvatar(avatarUrl: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl }
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error updating user avatar:", error);
        return { success: false, error: error.message };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        if (!user.email) throw new Error("User email not found");

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            throw new Error("Current password is incorrect");
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        console.error("Error changing password:", error);
        return { success: false, error: error.message };
    }
}

export async function getBuyerTransactions() {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { data: transactions, error: transactionsError } = await supabase
            .from("transactions")
            .select("*")
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false });

        if (transactionsError) throw transactionsError;

        const productIds = transactions?.map(t => t.product_id) || [];
        
        if (productIds.length === 0) {
            return { success: true, data: [] };
        }

        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("product_id", productIds);

        if (productsError) throw productsError;

        const sellerIds = products?.map(p => p.seller_owner_id).filter(Boolean) || [];
        
        let users: any[] = [];
        if (sellerIds.length > 0) {
            const { data: usersData } = await supabase
                .from("users")
                .select("id, user_fullname, user_email")
                .in("id", sellerIds);
            users = usersData || [];
        }

        const enrichedTransactions = transactions?.map(transaction => {
            const product = products?.find(p => p.product_id === transaction.product_id);
            const seller = users?.find(u => u.id === product?.seller_owner_id);
            
            return {
                ...transaction,
                products: {
                    ...product,
                    seller_owner_id: seller
                }
            };
        }) || [];

        return { success: true, data: enrichedTransactions };
    } catch (error: any) {
        console.error("Error fetching buyer transactions:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function getTransactionById(transactionId: string) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { data: transaction, error: transactionError } = await supabase
            .from("transactions")
            .select("*")
            .eq("transaction_id", transactionId)
            .eq("buyer_id", user.id)
            .single();

        if (transactionError) throw transactionError;

        const { data: product, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("product_id", transaction.product_id)
            .single();

        if (productError) throw productError;

        let seller = null;
        if (product.seller_owner_id) {
            const { data: sellerData } = await supabase
                .from("users")
                .select("id, user_fullname, user_email")
                .eq("id", product.seller_owner_id)
                .single();
            seller = sellerData;
        }

        const enrichedTransaction = {
            ...transaction,
            products: {
                ...product,
                seller_owner_id: seller
            }
        };

        return { success: true, data: enrichedTransaction };
    } catch (error: any) {
        console.error("Error fetching transaction:", error);
        return { success: false, error: error.message, data: null };
    }
}
