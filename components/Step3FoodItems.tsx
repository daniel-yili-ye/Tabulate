// components/Step3FoodItems.tsx
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export default function Step3FoodItems({ formData, updateFormData }) {
  const addFoodItem = () => {
    updateFormData("foodItems", [
      ...formData.foodItems,
      { item: "", price: "" },
    ]);
  };

  const removeFoodItem = (index) => {
    const newFoodItems = formData.foodItems.filter((_, i) => i !== index);
    updateFormData("foodItems", newFoodItems);
  };

  const updateFoodItem = (index, field, value) => {
    const newFoodItems = formData.foodItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    updateFormData("foodItems", newFoodItems);
  };

  const updateExtraField = (field, value) => {
    updateFormData(field, value);
  };

  return (
    <div>
      {formData.foodItems.map((item, index) => (
        <div key={index} className="flex space-x-2 mb-2">
          <Input
            value={item.item}
            onChange={(e) => updateFoodItem(index, "item", e.target.value)}
            placeholder="Food item"
          />
          <Input
            value={item.price}
            onChange={(e) => updateFoodItem(index, "price", e.target.value)}
            placeholder="Price"
            type="number"
          />
          <Button onClick={() => removeFoodItem(index)} variant="destructive">
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={addFoodItem} className="mt-2 mb-4">
        Add Food Item
      </Button>

      <div className="space-y-2">
        <div>
          <Label htmlFor="tax">Tax (Optional)</Label>
          <Input
            id="tax"
            value={formData.tax || ""}
            onChange={(e) => updateExtraField("tax", e.target.value)}
            placeholder="Tax amount"
            type="number"
          />
        </div>
        <div>
          <Label htmlFor="tip">Tip (Optional)</Label>
          <Input
            id="tip"
            value={formData.tip || ""}
            onChange={(e) => updateExtraField("tip", e.target.value)}
            placeholder="Tip amount"
            type="number"
          />
        </div>
        <div>
          <Label htmlFor="discount">Discount (Optional)</Label>
          <Input
            id="discount"
            value={formData.discount || ""}
            onChange={(e) => updateExtraField("discount", e.target.value)}
            placeholder="Discount amount"
            type="number"
          />
        </div>
      </div>
    </div>
  );
}
