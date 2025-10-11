import { Input } from "@/components/ui/input";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value?: number;
  onChange?: (value: number) => void;
  ref?: React.Ref<HTMLInputElement>;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  ref,
  ...props
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, "");
    if (input === "") {
      onChange?.(0);
      return;
    }
    const cents = parseInt(input, 10);
    const dollars = cents / 100;
    onChange?.(dollars);
  };

  const displayValue =
    !value || value === 0 ? "" : (value as number).toFixed(2);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        $
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={`pl-8 pr-2 text-right ${className || ""}`}
        placeholder="0.00"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
