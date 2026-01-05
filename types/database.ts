// Database types for the tabs table

/**
 * Split type options for each item
 * - equal: Split evenly among selected participants
 * - shares: Split by number of shares (e.g., 2 shares vs 1 share)
 * - percentage: Split by percentage allocation
 * - custom: Split by custom dollar amounts
 */
export type SplitType = "equal" | "shares" | "percentage" | "custom";

/**
 * Individual item from the receipt
 */
export interface ReceiptItem {
  item: string;
  price: number;
}

/**
 * Receipt data extracted from image or manually entered
 */
export interface ReceiptData {
  businessName: string;
  date: string; // ISO date string
  items: ReceiptItem[];
  tax?: number;
  tip?: number;
  discount?: number;
  subtotal: number;
  total: number;
}

/**
 * Participant in the bill split
 */
export interface Participant {
  id: number;
  name: string;
}

/**
 * Allocation for a single item - which participants are included and how
 */
export interface ItemAllocation {
  itemIndex: number;
  splitType: SplitType;
  participantIds: number[]; // Participants included in this split
  
  // For "shares" split type
  shares?: Record<number, number>; // participantId -> number of shares
  
  // For "percentage" split type  
  percentages?: Record<number, number>; // participantId -> percentage (should sum to 100)
  
  // For "custom" split type
  customAmounts?: Record<number, number>; // participantId -> dollar amount
}

/**
 * Computed allocation result for a single participant
 */
export interface PersonAllocation {
  id: number;
  name: string;
  items: {
    item: string;
    fullPrice?: number;
    price: number;
    participants: number;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
}

/**
 * Overall computed allocation
 */
export interface ComputedAllocation {
  people: PersonAllocation[];
  overallTotal?: number;
  overallSubtotal?: number;
  totalTax?: number;
  totalTip?: number;
  totalDiscount?: number;
}

/**
 * The complete data structure stored in the `data` JSONB column
 */
export interface TabData {
  receipt: ReceiptData;
  participants: Participant[];
  allocations: ItemAllocation[];
  computed: ComputedAllocation;
}

/**
 * Full tab record from the database
 */
export interface Tab {
  id: string;
  created_at: string;
  slug: string;
  user_id?: string | null;
  receipt_image_url?: string | null;
  data: TabData;
  
  // Legacy columns (will be removed after migration verification)
  form_data?: unknown;
  allocation?: unknown;
}

/**
 * Request body for creating a new tab
 */
export interface CreateTabRequest {
  receipt: ReceiptData;
  participants: Participant[];
  allocations: ItemAllocation[];
  receiptImageUrl?: string | null;
}

/**
 * Response from creating a tab
 */
export interface CreateTabResponse {
  success: boolean;
  tabId?: string;
  shareUrl?: string;
  error?: string;
}

/**
 * Response from fetching a tab
 */
export interface GetTabResponse {
  success: boolean;
  data?: Tab;
  error?: string;
}

