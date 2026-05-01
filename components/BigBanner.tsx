import { Button } from "./ui/button";

export function BigBanner() {
    return (
        <section className="w-full flex justify-center">
            <div className="max-w-7xl rounded-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-[380px]">

                {/* LEFT SIDE */}
                <div className="bg-black text-white p-8 sm:p-10 flex flex-col justify-center gap-5">

                    <span className="text-xs tracking-widest text-white/70 uppercase">
                        New Additions
                    </span>

                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                        SPRING SALE
                        <span className="ml-2">🚀</span>
                    </h1>

                    <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-sm">
                        Feed your creativity with 50% off 300+ of our top assets, including tools, 3D environments, audio, and more.
                    </p>

                    <Button className="w-fit" variant={"red_default"}>SHOP SALE</Button>
                </div>

                {/* RIGHT SIDE */}
                <div className="relative w-full h-full min-h-[300px] md:min-h-full">
                    <img
                        src="/sample-pics/SinSpire Girl.png"
                        alt="Sin Spire Girl"
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