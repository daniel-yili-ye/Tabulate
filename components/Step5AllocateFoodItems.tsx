import { Form, useFieldArray, useForm, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { FormData } from "../lib/formSchema";
import { Checkbox } from "./ui/checkbox";

export default function Step5AllocateFoodItems() {
  const { control } = useFormContext<FormData>();

  const { fields: stepThreeFields } = useFieldArray({
    control,
    name: "stepThree.foodItems",
  });

  const { fields: stepFourFields } = useFieldArray({
    control,
    name: "stepFour",
  });

  const { fields: stepFiveFields } = useFieldArray({
    control,
    name: "stepFive",
  });

  return (
    <div className="space-y-3">
      {stepThreeFields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`stepThree.foodItems.${index}`}
          render={() => (
            <FormItem>
              <FormLabel className="text-base">{field.item}</FormLabel>
              {stepFourFields.map((item) => (
                <FormField
                  key={item.id}
                  control={control}
                  name={`stepFive.${index}.persons`}
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              return checked
                                ? field.onChange([...currentValue, item.id])
                                : field.onChange(
                                    currentValue.filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.name}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
