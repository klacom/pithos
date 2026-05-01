import { Button } from '@/components/ui/button'
import LineChart from '@/components/technical-components/LineChart'
import CardStat from '@/components/technical-components/CardStat'

import {
  Eye,
  ShoppingBag,
  CreditCard,
  BarChart3,
  ArrowUpRight
} from 'lucide-react'

const SellerDashboard = () => {
  const iconSize = 32

  return (
    <div className="flex flex-col p-4 bg-background w-full gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your assets, sales, and performance
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">New Asset</Button>
          <Button>Publish</Button>
        </div>
      </div>

      <hr />

      {/* STATS */}
      <div className="flex gap-4 w-full *:w-full">
        <CardStat
          header="1,240"
          subHeader="Total Views"
          icon={<BarChart3 size={iconSize} />}
        />
        <CardStat
          header="384"
          subHeader="Downloads"
          icon={<ShoppingBag size={iconSize} />}
        />
        <CardStat
          header="$2,420"
          subHeader="Revenue"
          icon={<CreditCard size={iconSize} />}
        />
      </div>

      {/* ACTIVITY PANELS */}
      <div className="flex gap-4 w-full h-[260px]">

        {/* Recent Assets */}
        <div className="w-full bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col">
          <h2 className="font-bold text-xl">Recent Assets</h2>
          <hr className="my-2" />

          <div className="flex flex-col gap-2 text-sm">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex gap-2">
                  <p>Asset Name</p>
                </div>
                <Button size="icon" variant="red_default">
                  <Eye size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="w-full bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col">
          <h2 className="font-bold text-xl">Recent Orders</h2>
          <hr className="my-2" />

          <div className="flex flex-col gap-2 text-sm">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <p>#ORD-{1000 + i}</p>
                <Button size="icon" variant="red_default">
                  <Eye size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="flex gap-4 w-full h-[320px] overflow-hidden">

        {/* CHART */}
        <div className="flex-1 min-w-0 bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">Revenue Summary</h2>
            <Button size="sm" variant="outline">Export</Button>
          </div>

          <div className="h-full overflow-hidden">
            <LineChart />
          </div>

        </div>

        {/* SIDE INFO */}
        <div className="w-[320px] flex flex-col gap-4">

          {/* Active Project */}
          <div className="bg-primary-foreground border border-muted rounded-xl p-4">
            <h2 className="font-bold text-lg">Active Project</h2>
            <p className="text-sm mt-2">Sinspire Assets</p>

            <div className="mt-4 text-sm flex justify-between">
              <span>Status</span>
              <span className="font-medium">Published</span>
            </div>

            <div className="text-sm flex justify-between">
              <span>Updated</span>
              <span className="font-medium">2 days ago</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-primary-foreground border rounded-xl p-4">
            <h2 className="font-bold text-lg">Revenue</h2>

            <div className="mt-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Pending</span>
                <span>$812</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>$1,608</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm border-t pt-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={16} />
                Growth
              </div>
              <span className="font-medium">+14.6%</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SellerDashboard