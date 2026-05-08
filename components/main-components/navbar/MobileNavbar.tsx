import { Suspense } from "react";
import { NavbarLogo } from "./NavbarLogo";
import { NavbarActions } from "./NavbarActions";
import NavSearchBar from "./NavSearchBar";
import { X } from "lucide-react";

export function MobileNavbar({
    open,
    setOpen,
    config,
    role,
}: any) {
    return (
        <div
            className={`
                lg:hidden fixed inset-0 z-[100]
                flex flex-col bg-background text-foreground
                transition-all duration-300 ease-in-out
                ${open ? "translate-x-0" : "translate-x-full"}
            `}
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <NavbarLogo />
                <button 
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl hover:bg-accent transition-colors text-foreground"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10 bg-background">
                {/* Search Section */}
                <div className="w-full">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 ml-1">Search</p>
                    <Suspense fallback={<div className="h-12 w-full bg-muted animate-pulse rounded-xl" />}>
                        {config.showSearch && <NavSearchBar />}
                    </Suspense>
                </div>

                {/* Quick Actions Section */}
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Account & Settings</p>
                    <div className="bg-muted/50 rounded-[24px] p-6">
                        <NavbarActions
                            showCart={true}
                            dbLink={config.dbLink}
                            role={role}
                            className="justify-between w-full text-foreground"
                            themeVariant="toggle"
                        />
                    </div>
                </div>

                {/* Additional Links can go here */}
            </div>

            {/* Bottom Footer (Optional) */}
            <div className="p-6 border-t mt-auto bg-background">
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    Pithos Digital Assets &copy; 2024
                </p>
            </div>
        </div>
    );
}