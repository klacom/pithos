import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatarUrl, userHasAvatar } from "@/lib/user-profiles";

const supabase = createAdminClient();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ product_id: string }> },
) {
  try {
    const { product_id } = await params;
    const supabase = createAdminClient();
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    // Get user's full name from database for immediate response
    const { data: userData } = await supabase
      .from("users")
      .select("user_fullname, user_email")
      .eq("id", user.id)
      .single();

    const body = await req.json();
    const { rating, review_description } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Validate review text is not blank or whitespace only
    if (!review_description || review_description.trim().length === 0) {
      return NextResponse.json({ error: "Review text cannot be blank" }, { status: 400 });
    }

    // Check if user has purchased this product
    const { data: purchase } = await supabase
      .from("transactions")
      .select("*")
      .eq("buyer_id", user.id)
      .eq("product_id", product_id)
      .eq("status", "completed")
      .single();

    if (!purchase) {
      return NextResponse.json({ error: "You can only review products you have purchased" }, { status: 400 });
    }

    // Check if user has already reviewed this product
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product_id)
      .eq("reviewer_id", user.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Verify product exists
    const { data: product } = await supabase
      .from("products")
      .select("product_id")
      .eq("product_id", product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create the review
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        product_id,
        reviewer_id: user.id,
        rating,
        review_description: review_description || "",
        created_at: new Date().toISOString(), // Explicitly set timestamp
      })
      .select()
      .single();

    if (error) {
      console.error("Review creation error:", error);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    // Get user's avatar URL for immediate response
    const avatarUrl = await userHasAvatar(user.id) 
      ? getUserAvatarUrl(user.id) 
      : null;

    return NextResponse.json({ 
      success: true, 
      review: {
        ...review,
        review_text: review.review_description || "", // Map to review_text for frontend
        buyer_name: userData?.user_fullname || userData?.user_email?.split('@')[0] || "Verified buyer",
        buyer_avatar: avatarUrl,
      }
    });

  } catch (err) {
    console.error("Review submission error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ product_id: string }> },
) {
  try {
    const { product_id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
      return NextResponse.json(
        { reviews: [], avgRating: 0, reviewCount: 0 },
        { status: 200 },
      );
    }

    let { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product_id)
      .order("created_at", { ascending: false });

    console.log(`Reviews for product ${product_id}:`, reviews?.length || 0, "found");

    if (error) {
      console.error("Reviews fetch error:", error);
      return NextResponse.json(
        { reviews: [], avgRating: 0, reviewCount: 0 },
        { status: 200 },
      );
    }

    // Don't auto-seed reviews - return empty if no reviews exist

    const buyerIds = [
      ...new Set((reviews ?? []).map((review) => String(review.reviewer_id ?? "")).filter(Boolean)),
    ];

    const { data: buyers } =
      buyerIds.length > 0
        ? await supabase.from("users").select("id, user_fullname, user_email").in("id", buyerIds)
        : { data: [] };

    console.log("Buyers found:", buyers);

    const buyerNameById = new Map(
      (buyers ?? []).map((buyer) => [
        String(buyer.id),
        String(buyer.user_fullname || buyer.user_email?.split('@')[0] || "Verified buyer"),
      ]),
    );

    // Check which buyers have avatars
    const buyerAvatarUrls = new Map<string, string>();
    for (const buyer of buyers ?? []) {
      const hasAvatar = await userHasAvatar(String(buyer.id));
      if (hasAvatar) {
        buyerAvatarUrls.set(String(buyer.id), getUserAvatarUrl(String(buyer.id)));
      }
    }

    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
        : 0;

    const mappedReviews = (reviews ?? []).map((review) => {
        const buyerName = buyerNameById.get(String(review.reviewer_id ?? ""));
        const avatarUrl = buyerAvatarUrls.get(String(review.reviewer_id ?? ""));
        console.log(`Mapping review ${review.reviewer_id} to buyer name:`, buyerName, 'avatar:', avatarUrl);
        return {
          ...review,
          review_text: review.review_description?.slice(0, 100000) || "", // Map to review_text for frontend
          review_description: review.review_description?.slice(0, 100000) || "", // Keep original field too
          buyer_name: buyerName || "Verified buyer",
          buyer_avatar: avatarUrl || null,
        };
      });

    console.log("Final mapped reviews:", mappedReviews);

    return NextResponse.json({
      reviews: mappedReviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews?.length || 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error", reviews: [], avgRating: 0, reviewCount: 0 },
      { status: 500 },
    );
  }
}
