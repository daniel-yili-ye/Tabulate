// src/components/Step1MealName.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Step1MealName({ formData, updateFormData }) {
  return (
    <div>
      <Label htmlFor="mealName">Meal Name</Label>
      <Input
        id="mealName"
        value={formData.mealName}
        onChange={(e) => updateFormData("mealName", e.target.value)}
        placeholder="Enter meal name"
      />
    </div>
  );
}
