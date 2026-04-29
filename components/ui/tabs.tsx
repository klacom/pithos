"use client";

import { useState } from "react";

type TabItem = {
    label: string;
    content: React.ReactNode;
};

const Tabs = ({ items }: { items: TabItem[] }) => {
    const [activeTab, setActiveTab] = useState(0); // ✅ 0-based

    return (
        <div className="flex flex-col gap-4 h-full">

            {/* Tab Headers */}
            <div className="flex w-full gap-8 font-medium text-lg border-b">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`pb-4 transition duration-300 ease-in-out
              hover:border-b-2 hover:border-b-chart-5 hover:text-chart-5
              ${activeTab === index
                                ? "border-b-2 border-b-accent text-accent"
                                : "text-muted-foreground"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="w-full h-full">
                {items[activeTab]?.content}
            </div>
        </div>
    );
};

export default Tabs;