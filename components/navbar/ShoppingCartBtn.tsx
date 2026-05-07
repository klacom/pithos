"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";

const ShoppingCartBtn = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let loading = false;

    const loadCount = async () => {
      if (loading) return;

      loading = true;

      try {
        const res = await fetch(`/api/cart/count`, { cache: "no-store" });
        if (!res.ok) return 0;
        const json = await res.json();

        if (mounted) {
          setCount(json.count ?? 0);
        }
      } catch (error) {
        console.error(error);
      } finally {
        loading = false;
      }
    };

    void loadCount();

    window.addEventListener("cart-updated", loadCount);
    // console.log("EVENT FIRED");

    return () => {
      mounted = false;
      window.removeEventListener("cart-updated", loadCount);
    };
  }, []);

  // useEffect(() => {
  //   console.log("MOUNT cart button");

  //   return () => console.log("UNMOUNT cart button");
  // }, []);

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
