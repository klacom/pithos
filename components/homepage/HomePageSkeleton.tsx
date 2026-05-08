import { SmallBannerSkeleton, BigBannerSkeleton, ListBannerSkeleton } from "../banner-announcements/BannerSkeletons"

export function HomePageSkeleton() {
    return (
        <div className="w-full flex flex-col gap-8">
            <SmallBannerSkeleton />
            <BigBannerSkeleton />
            <div className="h-12 w-full bg-muted/20 rounded-xl" /> {/* Category bar skeleton */}
            <ListBannerSkeleton />
            <ListBannerSkeleton />
        </div>
    )
}
