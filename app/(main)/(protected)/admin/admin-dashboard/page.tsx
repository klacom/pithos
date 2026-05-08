'use client'

import { useState, useEffect } from "react"
import CardStat from "@/components/technical-components/CardStat"
import { DiamondPercent, UserRoundPen, PackageOpen, UserRound, Eye, RefreshCw, Download, Users, Boxes, Notebook, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import LineChart from "@/components/technical-components/LineChart"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MdDashboard, MdPayments } from "react-icons/md"
import { FaUsers, FaWrench } from "react-icons/fa"
import { RiComputerFill } from "react-icons/ri"
import { HiDocument } from "react-icons/hi2"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"

interface DashboardStats {
    totalTransactions: number
    todayTransactions: number
    totalSellers: number
    totalBuyers: number
    totalProducts: number
    chartData: { name: string, total: number }[]
}

const AdminDashboardPage = () => {
    const iconSize = 32
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [username, setUsername] = useState("Admin")
    const supabase = createClient()

    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) setUsername(user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin")

                const res = await fetch('/api/admin/dashboard/stats')
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                console.log("Dashboard Statistics: ", data)
                setStats(data)
            } catch (error) {
                console.error('Dashboard error:', error)
                toast.error("Failed to load dashboard statistics")
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    const handleExport = () => {
        if (!stats) return
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Month,Revenue\n"
            + stats.chartData.map(d => `${d.name},${d.total}`).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `revenue_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Export started!")
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center w-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Syncing with PayMongo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col p-6 bg-background w-full gap-6'>
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className='font-bold text-3xl tracking-tight'>Welcome, {username}</h1>
                    <p className="text-muted-foreground text-sm">Here's what's happening with Pithos today.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Data
                </Button>
            </div>

            <hr />

            <div className='flex flex-col gap-6 h-full'>
                {/* Stats Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
                    <CardStat
                        header={stats?.todayTransactions.toString() || "0"}
                        subHeader="Transactions Today"
                        icon={<DiamondPercent size={iconSize} className="text-foreground" />}
                    />
                    <CardStat
                        header={stats?.totalSellers.toString() || "0"}
                        subHeader="Total Sellers"
                        icon={<UserRoundPen size={iconSize} className="text-foreground" />}
                    />
                    <CardStat
                        header={stats?.totalProducts.toString() || "0"}
                        subHeader="Total Products"
                        icon={<PackageOpen size={iconSize} className="text-foreground" />}
                    />
                    <CardStat
                        header={stats?.totalBuyers.toString() || "0"}
                        subHeader="Total Buyers"
                        icon={<UserRound size={iconSize} className="text-foreground" />}
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                    {/* Revenue Overview */}
                    <div className="flex-1 min-w-0 bg-card border border-muted rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <h2 className="font-bold text-xl flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Revenue Overview
                                </h2>
                                <p className="text-xs text-muted-foreground">Monthly earnings from PayMongo sales</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>

                        <div className="h-[300px] w-full">
                            <LineChart
                                labels={stats?.chartData.map((item) => item.name)}
                                values={stats?.chartData.map((item) => item.total)}
                                datasetLabel="Revenue"
                                chartTitle="Monthly Revenue"
                            />
                        </div>
                    </div>

                    {/* Quick Access Sidebar */}
                    <div className="lg:w-[100px] bg-card border border-muted rounded-2xl p-4 flex flex-col items-center gap-6 shadow-sm">
                        <div className="grid grid-cols-3 lg:grid-cols-1 gap-4 place-items-center">
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/admin-dashboard' title="Dashboard">
                                <MdDashboard size={24} />
                            </Link>
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/manage-users' title="Users">
                                <FaUsers size={24} />
                            </Link>
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/site-content' title="Content">
                                <RiComputerFill size={24} />
                            </Link>
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/system-config' title="Settings">
                                <FaWrench size={24} />
                            </Link>
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/payment-gateways' title="Payments">
                                <MdPayments size={24} />
                            </Link>
                            <Link
                                className="group p-3 rounded-xl bg-muted/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                href='/admin/audit-logs' title="Audits">
                                <HiDocument size={24} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Secondary Info Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <Card className="p-6 border-muted/60">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Total Sales Count</h3>
                                <p className="text-2xl font-black">{stats?.totalTransactions}</p>
                                <p className="text-xs text-muted-foreground">Lifetime successful orders</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-muted/60">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Active Community</h3>
                                <p className="text-2xl font-black">{(stats?.totalSellers || 0) + (stats?.totalBuyers || 0)}</p>
                                <p className="text-xs text-muted-foreground">Total registered users</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboardPage
