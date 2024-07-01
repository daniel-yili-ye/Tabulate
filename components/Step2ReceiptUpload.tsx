// components/Step2ReceiptUpload.tsx
import { UseFormReturn, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { FormData } from "../lib/formSchema";

export default function Step2ReceiptUpload() {
  const { control } = useFormContext<FormData>();

  return (
    <FormField
      control={control}
      name="stepTwo.receiptImage"
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
