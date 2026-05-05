import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ProductCard"

const page = () => {
  return (
    <main className="flex flex-col gap-8 px-4 md:px-20 lg:px-40 xl:px-60 2xl:px-80 w-full mb-4">

      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          Category
        </p>

        <h1 className="text-3xl lg:text-4xl font-bold">
          Anime{" "}
          <span className="text-muted-foreground font-normal">
            in All Categories
          </span>
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>420 results</span>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent"></span>
            Active
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-4 border-b pb-6">

        {/* CONTEXT */}
        <p className="text-sm text-muted-foreground">
          Showing results for <span className="text-white font-medium">“Anime”</span>
        </p>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">

          <Button variant="outline" size="sm">Price</Button>
          <Button variant="outline" size="sm">Sale</Button>
          <Button variant="outline" size="sm">Rating</Button>
          <Button variant="outline" size="sm">Date</Button>
          <Button variant="outline" size="sm">2D / 3D</Button>

          <div className="ml-auto">
            <Button variant="outline" size="sm">
              Sort: Relevance
            </Button>
          </div>

        </div>

        {/* ACTIVE FILTER TAGS */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs rounded-full bg-secondary">
            Price: $0–$50 ✕
          </span>
          <span className="px-3 py-1 text-xs rounded-full bg-secondary">
            Rating: 4★+ ✕
          </span>
        </div>

      </div>

      {/* PRODUCT GRID */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {[...Array(12)].map((_, i) => (
          <ProductCard
            key={i}
            title="Stellar Sci-Fi Pack"
            subtitle="Character Assets"
            rating={4.5}
            reviews={120}
            author="Lark Bolotaolo"
            price="$67.00"
            imageSrc="/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg"
            link="/product-detail/stellar-sci-fi-pack"
          />
        ))}

      </div>

    </main>
  )
}

export default page