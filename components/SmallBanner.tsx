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
            <div className="w-full pt-8 pb-4">
                <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-6 items-center justify-center text-sm text-muted-foreground`}>
                    {items.map((item, index) => {
                        // Dynamically get the icon component
                        const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;

                        return (
                            <div key={index} className="flex justify-center items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                <span>
                                    {item.prefix}{" "}
                                    <span className="font-semibold text-foreground">{item.highlight}</span>{" "}
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
