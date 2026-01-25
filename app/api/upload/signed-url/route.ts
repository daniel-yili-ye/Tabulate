import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

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

    const { fileName, contentType } = validationResult.data;
    
    // Generate a unique path with timestamp to avoid collisions
    const fileExt = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const path = `temp/${uniqueFileName}`;

    const { data, error } = await supabaseServer.storage
      .from("receipt-images")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Error creating signed upload URL:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
    });
  } catch (error) {
    console.error("Error in signed-url endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
