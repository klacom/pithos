import { Button } from "../ui/button";
import Link from "next/link";

type BigBannerContent = {
    label: string
    title: string
    emoji?: string
    description: string
    cta_text: string
    cta_link: string
    image_url: string
}

type Props = {
    content: BigBannerContent
}

export function BigBanner({ content }: Props) {
    if (!content) return null;

    return (
        <section className="w-full flex justify-center">
            <div className="max-w-7xl rounded-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-[380px] w-full border border-muted">

                {/* LEFT SIDE */}
                <div className="bg-black text-white p-8 sm:p-10 flex flex-col justify-center items-center text-center md:items-start md:text-left gap-5">

                    <span className="text-xs tracking-widest text-white/70 uppercase">
                        {content.label}
                    </span>

                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                        {content.title}
                        {content.emoji && <span className="ml-2">{content.emoji}</span>}
                    </h1>

                    <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-sm">
                        {content.description}
                    </p>

                    <Link href={content.cta_link || "#"}>
                        <Button className="w-fit font-bold px-8 h-12 rounded-xl" variant={"red_default"}>
                            {content.cta_text}
                        </Button>
                    </Link>
                </div>

                {/* RIGHT SIDE */}
                <div className="relative w-full h-full min-h-[300px] md:min-h-full">
                    <img
                        src={content.image_url || "/sample-pics/SinSpire Girl.png"}
                        alt={content.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                    />

                    {/* optional subtle overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/10" />
                </div>

            </div>
        </section>
    );
}
