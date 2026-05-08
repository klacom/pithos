import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createAdminClient();
    
    // Get all reviews that match the sample review descriptions
    const { data: sampleReviews, error } = await supabase
      .from("reviews")
      .select("*")
      .in("review_description", [
        "Super clean files and easy to integrate. The package contents matched the preview and saved me hours of setup.",
        "Solid quality overall. The included files were organized well and the textures looked great in my scene.",
        "Worth it. I used this right away on a client project and the presentation quality was already production-ready.",
        "Great asset."
      ]);

    if (error) {
      console.error("Error finding sample reviews:", error);
      return NextResponse.json({ error: "Failed to find sample reviews" }, { status: 500 });
    }

    if (!sampleReviews || sampleReviews.length === 0) {
      return NextResponse.json({ message: "No sample reviews found to clean up" });
    }

    // Delete all sample reviews
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .in("review_id", sampleReviews.map(r => r.review_id));

    if (deleteError) {
      console.error("Error deleting sample reviews:", deleteError);
      return NextResponse.json({ error: "Failed to delete sample reviews" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${sampleReviews.length} sample reviews`,
      deletedCount: sampleReviews.length 
    });

  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
