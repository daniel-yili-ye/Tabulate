import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Split, Trash2 } from "lucide-react";
import { FormData } from "@/lib/validation/formSchema";

interface ItemRowProps {
  index: number;
  canDelete: boolean;
  onSplit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export default function ItemRow({
  index,
  canDelete,
  onSplit,
  onDuplicate,
  onRemove,
}: ItemRowProps) {
  const { control } = useFormContext<FormData>();

  return (
    <div className="flex space-x-2">
      <Controller
        control={control}
        name={`stepItems.Items.${index}.item`}
        render={({ field }) => (
          <Field className="flex-1">
            <FieldContent>
              <Input
                {...field}
                id={`item-name-${index}`}
                placeholder={`Item name ${index + 1}`}
              />
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name={`stepItems.Items.${index}.price`}
        render={({ field }) => (
          <Field className="w-40">
            <FieldContent>
              <CurrencyInput
                id={`item-price-${index}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FieldContent>
          </Field>
        )}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" type="button">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" avoidCollisions>
          <DropdownMenuItem onClick={onSplit}>
            <Split className="h-4 w-4 mr-2" />
            Split Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate Item
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onRemove}
            className="text-destructive focus:text-destructive"
            disabled={!canDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
