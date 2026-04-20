import { BillAllocation } from "@/lib/validation/allocationSchema";
import { FormData } from "@/lib/validation/formSchema";
import PersonCard from "./PersonCard";
import ReceiptCard from "./ReceiptCard";

interface AllocationTableProps {
  allocation: BillAllocation;
  formData: FormData;
  total: number;
}

export default function AllocationTable({
  allocation,
  formData,
  total,
}: AllocationTableProps) {
  const subtotal = formData.stepItems.Items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Person Cards */}
      {allocation.people.map((person, index) => (
        <PersonCard
          key={person.id || index}
          person={person}
          defaultOpen={index === 0}
        />
      ))}

      {/* Receipt Card */}
      <ReceiptCard
        businessName={formData.stepItems.businessName}
        date={formData.stepItems.date}
        items={formData.stepItems.Items}
        subtotal={subtotal}
        tax={formData.stepItems.tax}
        tip={formData.stepItems.tip}
        discount={formData.stepItems.discount}
        total={total}
      />
    </div>
  );
}
