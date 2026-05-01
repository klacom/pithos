import { Star, ThumbsUp, Users, ShieldCheck } from "lucide-react";

export function SmallBanner() {
    return (
        <div className="w-full bg-background flex justify-center items-center">
            <div className="w-full pt-8 pb-4">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center text-sm text-muted-foreground">

                    {/* Item 1 */}
                    <div className="flex justify-center items-center gap-2">
                        <Star className="w-4 h-4" />
                        <span>
                            Over <span className="font-semibold text-foreground">13,000</span> top-rated assets
                        </span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex justify-center items-center gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        <span>
                            Rated by <span className="font-semibold text-foreground">85,000+</span> customers
                        </span>
                    </div>

                    {/* Item 3 */}
                    <div className="flex justify-center items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                            Supported by <span className="font-semibold text-foreground">100,000+</span> forum members
                        </span>
                    </div>

                    {/* Item 4 */}
                    <div className="flex justify-center items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                            Every asset <span className="font-semibold text-foreground">moderated</span> by Pithos
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}