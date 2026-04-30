import CardStat from "@/components/technical-components/CardStat"
import { DiamondPercent, UserRoundPen, PackageOpen, UserRound, Eye, Home, Users, Boxes, Notebook, MonitorCog, HandCoins, Star, Settings } from "lucide-react"
import LineChart from "@/components/technical-components/LineChart"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const page = () => {
    const iconSize = 32;
    const qlIconSize = 24;
    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4'>

            <div className="flex flex-row justify-between">
                <h1 className='font-bold text-3xl'>Welcome, Username</h1>
            </div>

            <hr />
            
            {/* Content */}
            <div className='flex flex-col gap-4 h-full'>


                {/* Cards */}
                <div className='flex gap-4 w-full lg:flex-nowrap flex-wrap'>
                    <CardStat header="12" subHeader="Transactions Today" icon={<DiamondPercent size={iconSize} color="background" />} />
                    <CardStat header="8" subHeader="Total Sellers" icon={<UserRoundPen size={iconSize} color="background" />} />
                    <CardStat header="146" subHeader="Total Products" icon={<PackageOpen size={iconSize} color="background" />} />
                    <CardStat header="16" subHeader="Total Buyers" icon={<UserRound size={iconSize} color="background" />} />
                </div>


                {/* Mini-Tables */}
                <div className="w-full flex gap-4">

                    {/* New Uploads */}
                    <div className="bg-primary-foreground border border-muted rounded-xl p-4 w-full flex flex-col h-full">
                        <h2 className="font-bold text-xl">New Uploads</h2>
                        <hr className="mt-1 mb-1" />

                        <div className="flex flex-col gap-2">

                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Image</p>
                                    <p>Product Name</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>
                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Image</p>
                                    <p>Product Name</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>
                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Image</p>
                                    <p>Product Name</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>

                        </div>

                    </div>

                    {/* New Orders */}
                    <div className="bg-primary-foreground border border-muted rounded-xl p-4 w-full flex flex-col h-full">
                        <h2 className="font-bold text-xl">New Orders</h2>
                        <hr className="mt-1 mb-1" />
                        <div className="flex flex-col gap-2">

                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Order ID</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>
                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Order ID</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>
                            <div className="flex flex-row justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <p>Order ID</p>
                                </div>
                                <Button variant={"red_default"}>
                                    <Eye size={iconSize} />
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>


                {/* Summary and Quick Links */}
                <div className="flex gap-4 w-full">

                    {/* Line Chart */}
                    <div className="bg-primary-foreground p-4 rounded-lg border border-muted flex flex-col gap-4 flex-1">
                        <h2 className="font-bold text-xl">Revenue Summary</h2>

                        <div className="min-h-[300px]">
                            <LineChart />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-primary-foreground p-4 rounded-lg border border-muted h-full text-xs flex flex-col gap-4">

                        {/* <h2 className="font-bold text-xl">Quick Links</h2> */}

                        {/* Links */}
                        <div className="grid grid-cols-2 gap-4 place-items-center">
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/admin-dashboard'}>
                                <Home size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/manage-users'}>
                                <Users size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/manage-products'}>
                                <Boxes size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/manage-orders'}>
                                <Notebook size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/site-content'}>
                                <MonitorCog size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/payment-gateways'}>
                                <HandCoins size={qlIconSize} />
                            </Link>
                            <Link className="hover:bg-accent hover:text-white p-2 rounded-md items-center flex gap-4" href={'/admin/reviews-ratings'}>
                                <Star size={qlIconSize} />
                            </Link>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    )
}

export default page
