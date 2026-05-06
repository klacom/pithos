"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartCount } from "@/app/shop-actions";
import { Button } from "./ui/button";

const ShoppingCartBtn = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadCount = async () => {
      try {
        const nextCount = await getCartCount();
        if (!ignore) {
          setCount(nextCount);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadCount();

    const handleUpdate = () => {
      void loadCount();
    };

    window.addEventListener("cart-updated", handleUpdate);

    return () => {
      ignore = true;
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, []);

  return (
    <Link href="/shopping-cart">
      <Button variant="ghost" size="sm" className="relative">
        <ShoppingCart size={16} />
        Cart
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
            {count}
          </span>
        ) : null}
      </Button>
    </Link>
  );
};

export default ShoppingCartBtn;
