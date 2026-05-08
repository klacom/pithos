import * as LucideIcons from "lucide-react";

type SmallBannerItem = {
    icon: string
    prefix: string
    highlight: string
    suffix: string
}

type Props = {
    content: {
        items: SmallBannerItem[]
    }
}

export function SmallBanner({ content }: Props) {
    const items = content?.items || [];

    return (
        <div className="w-full bg-background flex justify-center items-center">
            <div className="max-w-7xl w-full py-6 px-4">
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-xs md:text-sm text-muted-foreground">
                    {items.map((item, index) => {
                        // Dynamically get the icon component
                        const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;

                        return (
                            <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                                <IconComponent className="w-3.5 h-3.5 text-primary/60" />
                                <span>
                                    {item.prefix}{" "}
                                    <span className="font-bold text-foreground">{item.highlight}</span>{" "}
                                    {item.suffix}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
