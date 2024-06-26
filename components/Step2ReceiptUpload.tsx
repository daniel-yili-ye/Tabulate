// src/components/Step2ReceiptUpload.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Step2ReceiptUpload({ formData, updateFormData }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    updateFormData("receiptImage", file);
  };

  return (
    <div>
      <Label htmlFor="receiptImage">Upload Receipt (Optional)</Label>
      <Input id="receiptImage" type="file" onChange={handleFileChange} />
      {/* <Button
        className="mt-2"
        variant="outline"
        onClick={() => updateFormData("receiptImage", null)}
      >
        Skip
      </Button> */}
    </div>
  );
}
