import { createAdminClient } from "./supabase/admin";

/** Public bucket used for user profile pictures (see Supabase dashboard). */
export const USER_PROFILES_BUCKET = "user_profiles";

/**
 * Generate the public URL for a user's avatar
 * @param userId - The user's UUID
 * @returns The public URL to the user's avatar.png file
 */
export function getUserAvatarUrl(userId: string): string {
  const supabase = createAdminClient();
  const { data } = supabase.storage
    .from(USER_PROFILES_BUCKET)
    .getPublicUrl(`${userId}/avatar.png`);
  
  return data.publicUrl;
}

/**
 * Check if a user has an avatar
 * @param userId - The user's UUID
 * @returns Promise resolving to boolean indicating if avatar exists
 */
export async function userHasAvatar(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase.storage
      .from(USER_PROFILES_BUCKET)
      .list(`${userId}`, {
        limit: 1,
        search: "avatar.png"
      });
    
    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}
