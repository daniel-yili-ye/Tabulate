// src/components/Step2ReceiptUpload.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Step2ReceiptUpload({ formData, updateFormData }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      console.log(imageUrl);
      updateFormData("receiptImage", imageUrl);
    }
  };

  return (
    <div>
      <Label htmlFor="receiptImage">Upload Receipt (Optional)</Label>
      <Input id="receiptImage" type="file" onChange={handleFileChange} />
    </div>
  );
}
