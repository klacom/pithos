import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("homepage_blocks")
        .select("*")
        .order("order_index", { ascending: true })

    // console.log("HomePage Block Server :", data);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const supabase = createAdminClient();
    const { type } = await req.json();

    // Get current max order_index
    const { data: maxOrder } = await supabase
        .from("homepage_blocks")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

    const nextIndex = (maxOrder?.order_index ?? -1) + 1;

    let defaultContent = {};
    if (type === "small_banner") {
        defaultContent = { items: [{ icon: "Truck", prefix: "Free Shipping", highlight: "on orders over ₱500", suffix: "" }] };
    } else if (type === "big_banner") {
        defaultContent = {
            label: "NEW ARRIVAL",
            title: "Summer Collection",
            description: "Check out our latest assets for your next project.",
            cta_text: "BROWSE NOW",
            cta_link: "/product-listing",
            image_url: ""
        };
    } else if (type === "list_banner") {
        defaultContent = {
            title: "Newest Products",
            subtitle: "Freshly added to our store",
            listType: "views",
            selectedProductIds: []
        };
    }

    const { data, error } = await supabase
        .from("homepage_blocks")
        .insert({
            type,
            order_index: nextIndex,
            content: defaultContent,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
