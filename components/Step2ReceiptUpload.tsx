// components/Step2ReceiptUpload.tsx
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { FormData } from "../lib/formSchema";

interface Step2ReceiptUploadProps {
  form: UseFormReturn<FormData>;
}

export default function Step2ReceiptUpload({ form }: Step2ReceiptUploadProps) {
  return (
    <FormField
      control={form.control}
      name="receiptImage"
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>Upload Receipt (Optional)</FormLabel>
          <FormControl>
            <Input
              type="file"
              onChange={(e) => onChange(e.target.files?.[0] || null)}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
