"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";

type createAudit = (params: {
    action_name: string;
    action_description?: string;
    affected_resources?: string;
    actor?: string;
    email?: string;
}) => Promise<void>;

type LinkItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

const SideBar = ({ links, settingLink, createAudit }: { links: LinkItem[], settingLink?: LinkItem, createAudit: createAudit }) => {
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            // alert("Before Logout Audit ===")
            await createAudit({
                action_name: "LOGOUT_SUCCESS",
                action_description: "User logged out successfully",
                affected_resources: "auth",
            });
            // alert("After Logout Audit ===");
        } catch (error) {
            console.log("Audit Failed: ", error);
            console.error("Audit Failed FULL:", error);
            alert("Audit failed: " + JSON.stringify(error));
        }finally{
            // alert("Finally Logout Audit ===");
            const supabase = createClient();
            await supabase.auth.signOut({ scope: "local" });
            window.location.href = "/auth/login";
        }
    };

    return (
        <aside
            className={`
        bg-primary-foreground text-primary border-r border-r-border
        h-full p-4 flex flex-col justify-between text-sm
        transition-all duration-300
        ${collapsed ? "w-[80px]" : "w-[300px]"}
      `}
        >
            {/* Top */}
            <div className="flex flex-col gap-4">
                {/* Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`flex ${collapsed ? "justify-center" : "justify-start"} items-center gap-3 p-2 rounded-md hover:bg-accent hover:text-white"`}
                >
                    <GiHamburgerMenu size={18} />
                    {!collapsed && <span>Collapse</span>}
                </button>

                {/* Links */}
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        title={collapsed ? link.label : ""}
                        className={`hover:bg-accent hover:text-white p-2 rounded-md flex items-center ${collapsed ? "justify-center" : "gap-4"}`}
                    >
                        {link.icon}
                        {!collapsed && <span>{link.label}</span>}
                    </Link>
                ))}
            </div>

            {/* Bottom */}
            <div className="flex flex-col gap-4">
                {settingLink && (
                    <Link
                        href={settingLink.href}
                        title={collapsed ? settingLink.label : ""}
                        className={`hover:bg-accent hover:text-white p-2 rounded-md flex items-center ${collapsed ? "justify-center" : "gap-4"}`}
                    >
                        {settingLink.icon}
                        {!collapsed && <span>{settingLink.label}</span>}
                    </Link>
                )}

                <div className={collapsed ? "flex justify-center" : ""}>
                    <Button
                        onClick={handleLogout}
                        className={`${collapsed ? "justify-center" : "gap-4 justify-start"} w-full`}
                        title={collapsed ? "Logout" : ""}
                        variant={"red_ghost"}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Logout</span>}
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default SideBar;