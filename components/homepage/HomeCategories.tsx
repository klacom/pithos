import { listCategories } from "@/lib/public/categories";
import Link from "next/link";
import { 
  Gamepad2, 
  Layers, 
  Map, 
  Sword, 
  Users, 
  Trees, 
  Layout, 
  Box,
  CircleHelp
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  "3D Models": Box,
  "Textures": Layers,
  "Environments": Map,
  "Weapons": Sword,
  "Characters": Users,
  "Nature": Trees,
  "UI Kits": Layout,
};

export async function HomeCategories() {
  const categories = await listCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Explore our wide range of digital assets</p>
          </div>
          <Link 
            href="/product-listing" 
            className="text-primary text-sm font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || CircleHelp;
            
            return (
              <Link
                key={cat.id}
                href={`/product-listing?category=${cat.id}`}
                className="group flex flex-col items-center justify-center p-8 bg-card border border-muted rounded-3xl hover:bg-primary/5 hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-500">
                  <Icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold group-hover:text-primary transition-colors duration-500 block">
                    {cat.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}