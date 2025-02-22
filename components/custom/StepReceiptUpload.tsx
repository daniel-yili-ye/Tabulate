// components/StepReceiptUpload.tsx
import { UseFormReturn, useFormContext } from "react-hook-form";
import Image from "next/image";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { FormData } from "../../schema/formSchema";

export default function StepReceiptUpload() {
  const { control, watch, setValue } = useFormContext<FormData>();
  const receiptImageURL = watch("stepReceiptUpload.receiptImageURL");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setValue("stepReceiptUpload.receiptImageURL", imageUrl);
      setValue("stepReceiptUpload.image", file);
    }
  };

  return (
    <FormField
      control={control}
      name="stepReceiptUpload.receiptImageURL"
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>Upload Receipt (Optional)</FormLabel>
          <FormControl>
            <Input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              {...field}
            />
          </FormControl>
          {receiptImageURL && (
            <Image
              src={receiptImageURL}
              alt="Receipt"
              width={300}
              height={300}
            />
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
