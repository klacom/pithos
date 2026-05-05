
import FilterBy from "@/components/technical-components/FilterBy"
import SortBy from "@/components/technical-components/SortBy"
import SearchButton from "@/components/technical-components/SearchButton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const page = () => {
    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4 h-full justify-between overflow-y-auto'>
            <div className="flex flex-col bg-background w-full gap-4">
                <div className="flex flex-row justify-between">
                    <h1 className='font-bold text-3xl'>Your Orders</h1>
                    <div className="flex flex-row gap-2 h-full items-center">
                        <SortBy sortOptions={["Date", "Amount", "Status"]} />
                        <FilterBy filterOptions={["All", "Pending", "Completed", "Refunded", "Cancelled"]} />
                       
                        <SearchButton />
                    </div>
                </div>
                <hr />
                {/* Content */}
                <div className='flex flex-col gap-4 h-full'>

                    {/* Table */}
                    <div className="w-full p-4 bg-primary-foreground border border-muted rounded-lg flex-1 flex flex-col justify-between">
                        <div className="overflow-x-auto">
                            <table className="*:*:*:border *:*:*:border-muted *:*:*:p-4 w-full bg-primary-foreground" border={1}>
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Buyer ID</th>
                                        <th>Product ID</th>
                                        <th>Created At</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>129616 182736 1293</td>
                                        <td>98547 1086 95816</td>
                                        <td>1231 98167 9817698</td>
                                        <td>1-1-2026</td>
                                        <td>PHP67,000.00</td>
                                        <td>Active</td>
                                        <td><Button variant="link" className="text-red-500 hover:text-red-600 px-0">View Details</Button></td>
                                    </tr>
                                    <tr>
                                        <td>129616 182736 1293</td>
                                        <td>98547 1086 95816</td>
                                        <td>1231 98167 9817698</td>
                                        <td>1-1-2026</td>
                                        <td>PHP67,000.00</td>
                                        <td>Active</td>
                                        <td><Button variant="link" className="text-red-500 hover:text-red-600 px-0">View Details</Button></td>
                                    </tr>
                                    <tr>
                                        <td>129616 182736 1293</td>
                                        <td>98547 1086 95816</td>
                                        <td>1231 98167 9817698</td>
                                        <td>1-1-2026</td>
                                        <td>PHP67,000.00</td>
                                        <td>Active</td>
                                        <td><Button variant="link" className="text-red-500 hover:text-red-600 px-0">View Details</Button></td>
                                    </tr>
                                    <tr>
                                        <td>129616 182736 1293</td>
                                        <td>98547 1086 95816</td>
                                        <td>1231 98167 9817698</td>
                                        <td>1-1-2026</td>
                                        <td>PHP67,000.00</td>
                                        <td>Active</td>
                                        <td><Button variant="link" className="text-red-500 hover:text-red-600 px-0">View Details</Button></td>
                                    </tr>
                                    <tr>
                                        <td>129616 182736 1293</td>
                                        <td>98547 1086 95816</td>
                                        <td>1231 98167 9817698</td>
                                        <td>1-1-2026</td>
                                        <td>PHP67,000.00</td>
                                        <td>Active</td>
                                        <td><Button variant="link" className="text-red-500 hover:text-red-600 px-0">View Details</Button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-2 pt-4 mt-4 border-t border-muted">
                            <p className="text-sm text-muted-foreground">Showing <span className="font-medium text-foreground">1</span> to <span className="font-medium text-foreground">5</span> of <span className="font-medium text-foreground">24</span> results</p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 px-2" disabled>
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Previous Page</span>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-accent text-accent-foreground">1</Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">3</Button>
                                <span className="text-muted-foreground px-2">...</span>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">5</Button>
                                <Button variant="outline" size="sm" className="h-8 px-2">
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">Next Page</span>
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <p className="text-muted-foreground self-center mt-4"><i>Pithos has a commission percentage of 30/70, wheareas the 30% of the assets revenue goes to Pithos, and the rest (70%) goes to the asset sellers.</i> <Link href="#" className="text-medium text-accent">Learn More</Link></p>
        </div>
    )
}

export default page