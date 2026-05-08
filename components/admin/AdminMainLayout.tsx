import { ReactNode } from "react";
import SideBar from "../main-components/sidebar/SideBar";
import { FaUsers, FaWrench } from "react-icons/fa";
import { HiDocument } from "react-icons/hi2";
import { RiComputerFill } from "react-icons/ri";
import { MdPayments, MdDashboard } from "react-icons/md";
import { createAudit } from "@/lib/supabase/create-audit";

const AdminMainLayout = ({ children }: { children: ReactNode }) => {
    const iconSize = 18;

    const links = [
        {
            href: "/admin/admin-dashboard",
            label: "Dashboard",
            icon: <MdDashboard size={iconSize} />,
        },
        {
            href: "/admin/manage-users",
            label: "Users",
            icon: <FaUsers size={iconSize} />,
        },
        {
            href: "/admin/site-content",
            label: "Site Content",
            icon: <RiComputerFill size={iconSize} />,
        },
        {
            href: "/admin/system-config",
            label: "System Config",
            icon: <FaWrench size={iconSize} />,
        },
        {
            href: "/admin/payment-gateways",
            label: "Payment Gateway",
            icon: <MdPayments size={iconSize} />,
        },
        {
            href: "/admin/audit-logs",
            label: "Audit Logs",
            icon: <HiDocument size={iconSize} />,
        },
    ];

    return (
        <main className="flex w-full h-full min-h-0 overflow-hidden">
            <SideBar 
                links={links} 
                createAudit={createAudit} 
            />

            <section className="flex-1 min-w-0 h-full overflow-y-auto">
                {children}
            </section>
        </main>
    );
};

export default AdminMainLayout;