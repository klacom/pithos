import { createAdminClient } from "@/lib/supabase/admin";

export type ListingCategory = { id: string; name: string };

export async function listCategories(): Promise<ListingCategory[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  if (error || !data) {
    if (error) console.error("categories fetch:", error.message);
    return [];
  }
  return (data as Array<{ id: string; name: string }>).map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
  }));
}
