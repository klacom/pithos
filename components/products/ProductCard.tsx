import { Card } from "../ui/card";
import Image from "next/image"
import { Star } from "lucide-react";
import { Box } from "@deemlol/next-icons";
import Link from "next/link";

interface AssetCardProps {
    title: string;
    subtitle: string;
    rating: number;
    reviews: number;
    author: string;
    price: string;
    imageSrc: string;
    is3D?: boolean;
    link: string;
  }

export function ProductCard({
    title = "ROCK & BOULDERS 2",
    subtitle = "Rock and Boulders 2",
    rating = 4.7,
    reviews = 611,
    author = "Manufactura K4",
    price = "Free",
    imageSrc = "/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg",
    is3D = true,
    link = "/"
    }: AssetCardProps) {
    return (
        <Link href={link} className="w-full">
            <Card className="group relative w-full overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:cursor-pointer h-full">
                {/* Image container with overlay badge at bottom */}
                <div className="relative aspect-[4/3] w-full">
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 320px"
                        priority={false} // set to true if above the fold
                    />
                </div>

                {/* Metadata / content below image */}
                <div className="space-y-2 p-4">
                    {is3D && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <div className="rounded bg-primary/10 px-1.5 py-0.5 text-primary"><Box/></div>
                        <span>3D</span>
                    </div>
                    )}

                    <h3 className="line-clamp-2 text-base font-semibold">{subtitle}</h3>

                    <div className="flex items-center flex-row gap-2 text-sm">
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3 w-3 md:h-4 md:w-4 ${
                                        i < Math.floor(rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : i < rating
                                        ? 'fill-yellow-400/50 text-yellow-400'
                                        : 'text-foreground/30'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs line-clamp-1 md:text-md sm:ml-1 text-foreground/70">
                            {rating} ({reviews})
                        </span>
                    </div>

                    <p className="text-sm text-foreground/80">{author}</p>

                    <p className="font-medium text-primary">{price}</p>
                </div>
            </Card>
        </Link>
    );
}
