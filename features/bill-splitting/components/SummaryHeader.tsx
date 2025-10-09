import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ViewReceipt from "@/features/bill-creation/components/ViewReceipt";
import ShareModal from "@/features/bill-sharing/components/ShareModal";
import { formatDate } from "../utils/formatters";

interface SummaryHeaderProps {
  businessName: string;
  date: Date | string;
  receiptImageURL?: string;
  shareUrl: string;
  fullUrl: string;
  onShare: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSaving: boolean;
}

export default function SummaryHeader({
  businessName,
  date,
  receiptImageURL,
  shareUrl,
  fullUrl,
  onShare,
  isOpen,
  setIsOpen,
  isSaving,
}: SummaryHeaderProps) {
  return (
    <CardHeader className="space-y-4">
      <div className="space-y-4 md:flex md:justify-between md:items-center md:space-y-0">
        <div>
          <CardTitle className="text-lg font-medium">{businessName}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {formatDate(date)}
          </CardDescription>
        </div>
        <div className="flex space-x-4">
          <ViewReceipt receiptImageURL={receiptImageURL} />
          <ShareModal
            url={shareUrl || fullUrl}
            onShare={onShare}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isSaving={isSaving}
            setIsSaving={() => {}}
          />
        </div>
      </div>
      <Separator />
    </CardHeader>
  );
}
