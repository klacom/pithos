import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ViewAssetPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    redirect("/seller/assets");
  }

  redirect(`/product-detail/${id}`);
}
