"use server";

import { createClient } from "@/lib/supabase/server";

export async function addToCart(productId: string) {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: "You must be logged in to add items to your cart." };
    }

    try {
        console.log("Adding to cart:", { userId: user.id, productId });
        // Upsert into cart
        const { data, error } = await supabase
            .from('cart')
            .upsert({ 
                user_id: user.id, 
                product_id: productId
            }, { onConflict: 'user_id,product_id' })
            .select();

        if (error) {
            console.error("Supabase error adding to cart:", error);
            throw error;
        }
        
        console.log("Successfully added to cart:", data);
        return { success: true };
    } catch (error: any) {
        console.error("Error adding to cart:", error);
        return { success: false, error: error.message };
    }
}

export async function addToFavorites(productId: string) {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: "You must be logged in to add items to favorites." };
    }

    try {
        console.log("Toggling favorite:", { userId: user.id, productId });
        // Check if already favorited
        const { data: existing, error: fetchError } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .maybeSingle();

        if (fetchError) {
            console.error("Error fetching favorite:", fetchError);
            throw fetchError;
        }

        if (existing) {
            console.log("Removing from favorites:", existing.id);
            // Remove from favorites if already there (toggle effect)
            const { error: deleteError } = await supabase
                .from('favorites')
                .delete()
                .eq('id', existing.id);
            
            if (deleteError) {
                console.error("Error deleting favorite:", deleteError);
                throw deleteError;
            }
            return { success: true, action: 'removed' };
        } else {
            console.log("Adding to favorites...");
            // Add to favorites
            const { error: insertError } = await supabase
                .from('favorites')
                .insert({ 
                    user_id: user.id, 
                    product_id: productId 
                });

            if (insertError) {
                console.error("Error inserting favorite:", insertError);
                throw insertError;
            }
            return { success: true, action: 'added' };
        }
    } catch (error: any) {
        console.error("Error toggling favorite:", error);
        return { success: false, error: error.message };
    }
}
