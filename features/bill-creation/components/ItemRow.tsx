import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Split, Trash2 } from "lucide-react";
import { FormData } from "@/lib/validation/formSchema";

interface ItemRowProps {
  index: number;
  canDelete: boolean;
  onSplit: () => void;
  onRemove: () => void;
}

export default function ItemRow({
  index,
  canDelete,
  onSplit,
  onRemove,
}: ItemRowProps) {
  const { control } = useFormContext<FormData>();

  return (
    <div className="flex space-x-2">
      <FormField
        control={control}
        name={`stepItems.Items.${index}.item`}
        render={({ field }) => (
          <FormItem className="w-full">
            <FormControl>
              <Input placeholder={`Item name ${index + 1}`} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`stepItems.Items.${index}.price`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  $
                </span>
                <Input
                  className="pl-8"
                  placeholder="0.00"
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
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
