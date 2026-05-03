import SellerOrdersPageClient from "@/components/seller/SellerOrdersPageClient";

export default function SellerOrdersPage() {
  return (
    <div className="flex flex-col p-4 bg-background w-full gap-4 h-full justify-between overflow-y-auto">
      <div className="flex flex-col bg-background w-full gap-4">
        <SellerOrdersPageClient />
      </div>
    </div>
  );
}
