import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

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
        <section className="w-full flex justify-center py-4">
            <div className="max-w-7xl rounded-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-[450px] w-full border border-muted shadow-2xl bg-black relative group">

                {/* Background Glow Effect */}
                <div className="absolute top-0 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                {/* LEFT SIDE - CONTENT */}
                <div className="relative z-10 text-white p-10 sm:p-16 flex flex-col justify-center items-center text-center md:items-start md:text-left gap-6">

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 w-fit">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white/90 uppercase">
                            {content.label}
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight">
                        {content.title}
                        {content.emoji && <span className="ml-3 inline-block">{content.emoji}</span>}
                    </h1>

                    <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-md font-medium">
                        {content.description}
                    </p>

                    <Link href={content.cta_link || "#"} className="mt-2">
                        <Button className="w-fit font-bold px-10 h-14 rounded-2xl text-lg group/btn relative overflow-hidden transition-all hover:scale-105 active:scale-95" variant={"red_default"}>
                            <span className="relative z-10 flex items-center gap-2">
                                {content.cta_text}
                                <ArrowRight size={20} className="transition-transform group-hover/btn:translate-x-1" />
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* RIGHT SIDE - MEDIA */}
                <div className="relative w-full h-full min-h-[350px] md:min-h-full overflow-hidden">
                    {(content.image_url && content.image_url.toLowerCase().endsWith(".mp4")) ? (
                        <video
                            src={content.image_url}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={content.image_url || "/sample-pics/SinSpire Girl.png"}
                            alt={content.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="eager"
                        />
                    )}

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:block hidden" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden block" />

                    {/* Subtle light streak */}
                    <div className="absolute inset-0 opacity-30 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.1)_50%,transparent_60%)] bg-[length:200%_100%] animate-[shimmer_6s_infinite] pointer-events-none" />
                </div>

            </div>
        </section>
    );
}
