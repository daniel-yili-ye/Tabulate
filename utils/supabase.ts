import { createClient } from "@supabase/supabase-js";

// These would typically come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Log the Supabase URL for debugging
console.log("Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to upload a receipt image from a File object
export async function uploadReceiptImage(file: File): Promise<string> {
  try {
    // Generate a unique filename with original extension
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    console.log("Uploading to bucket:", "receipt-images");
    console.log("File name:", fileName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipt-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw uploadError;
    }

    console.log("Upload successful, data:", uploadData);

    // Get the public URL
    const { data } = supabase.storage
      .from("receipt-images")
      .getPublicUrl(fileName);

    console.log("Generated public URL:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading receipt image:", error);
    throw error;
  }
}

// Function to save bill data to Supabase
export async function saveBillData(billData: any) {
  try {
    console.log("Saving bill data:", billData);

    // Save the bill data
    const { data, error } = await supabase
      .from("bills")
      .insert([billData])
      .select("id");

    if (error) {
      console.error("Error inserting bill data:", error);
      throw error;
    }

    console.log("Bill data saved successfully, ID:", data?.[0]?.id);
    return data?.[0]?.id;
  } catch (error) {
    console.error("Error saving bill data:", error);
    throw error;
  }
}

// Function to get bill data by ID
export async function getBillData(id: string) {
  try {
    console.log("Fetching bill data for ID:", id);

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching bill data:", error);
      throw error;
    }

    console.log("Bill data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error getting bill data:", error);
    throw error;
  }
}
