const categories = ["2D Assets", "3D Assets", "Bundles", "Environments", "Tilesets"];

export function HomeCategories() {
  return (
    <div className="w-full">
      
      <div className="max-w-7xl mx-auto">
        
        <div className="flex gap-4 flex-wrap">
          
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex-1 min-w-[120px] h-[100px] px-6 py-2 bg-black text-white rounded-xl flex items-center justify-center hover:bg-[#C1121F] transition cursor-pointer"
            >
              {cat}
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}