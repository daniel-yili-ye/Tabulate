import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  imagePath: z.string().min(1, "Image path is required"),
});

/**
 * Finalize an uploaded image by moving it from temp/ to permanent/ folder.
 * This should be called when the form is submitted successfully.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { imagePath } = validationResult.data;

    // Move file from temp/ to permanent/ folder to mark it as finalized
    if (imagePath.startsWith("temp/")) {
      const newPath = imagePath.replace("temp/", "permanent/");
      
      // Copy to permanent location
      const { error: copyError } = await supabaseServer.storage
        .from("receipt-images")
        .copy(imagePath, newPath);

      if (copyError) {
        console.error("Error copying file to permanent location:", copyError);
        return NextResponse.json(
          { error: "Failed to finalize upload" },
          { status: 500 }
        );
      }

      // Delete from temp location
      const { error: deleteError } = await supabaseServer.storage
        .from("receipt-images")
        .remove([imagePath]);

      if (deleteError) {
        console.error("Error removing temp file:", deleteError);
        // Non-fatal - the file is already copied
      }

      return NextResponse.json({
        success: true,
        newPath,
      });
    }

    // If file is not in temp/, it's already permanent
    return NextResponse.json({
      success: true,
      newPath: imagePath,
    });
  } catch (error) {
    console.error("Error finalizing upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
