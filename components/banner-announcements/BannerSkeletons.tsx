import { Skeleton } from "../../components/ui/skeleton"

export const SmallBannerSkeleton = () => (
    <Skeleton className="w-full h-12 mb-4" />
)

export const BigBannerSkeleton = () => (
    <Skeleton className="w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl mb-4" />
)

export const ListBannerSkeleton = () => (
    <div className="w-full flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
        </div>
    </div>
)

export const ProductCardSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
    </div>
)
