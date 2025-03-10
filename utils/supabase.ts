import { createClient } from "@supabase/supabase-js";

// These would typically come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Log the Supabase URL for debugging
console.log("Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to upload a receipt image from a base64 string
export async function uploadReceiptImage(base64Image: string): Promise<string> {
  try {
    // Extract the base64 data (remove the data:image/png;base64, part)
    const base64Data = base64Image.split(",")[1];

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Generate a unique filename
    const fileName = `receipt-${Date.now()}.png`;

    console.log("Uploading to bucket:", "receipt-images");
    console.log("File name:", fileName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipt-images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw uploadError;
    }

    console.log("Upload successful, data:", uploadData);

    // Get the public URL using Supabase's getPublicUrl method
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

    // Check if there's a receipt image to upload
    if (
      billData.form_data?.stepReceiptUpload?.receiptImageURL &&
      billData.form_data.stepReceiptUpload.receiptImageURL.startsWith("blob:")
    ) {
      console.log("Found blob URL, converting to base64...");

      // Convert blob URL to base64
      const base64Image = await blobUrlToBase64(
        billData.form_data.stepReceiptUpload.receiptImageURL
      );

      console.log("Converted to base64, uploading to Supabase...");

      // Upload the image to Supabase Storage
      const permanentUrl = await uploadReceiptImage(base64Image);

      console.log("Image uploaded successfully, permanent URL:", permanentUrl);

      // Update the receipt image URL in the form data
      billData = {
        ...billData,
        form_data: {
          ...billData.form_data,
          stepReceiptUpload: {
            ...billData.form_data.stepReceiptUpload,
            receiptImageURL: permanentUrl,
          },
        },
      };
    }

    // Save the bill data with the updated image URL
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

// Helper function to convert blob URL to base64
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting blob to base64:", error);
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
