# Bill Splitting Feature

This feature handles the display and sharing of split bills after allocation.

## Structure

### Components

#### `Summary.tsx`

Main component that orchestrates the bill summary display. Uses custom hooks for logic and delegates UI rendering to smaller components.

**Props:**

- `formData: FormData` - The complete form data from bill creation
- `billId?: string` - Optional existing bill ID for viewing saved bills

#### `SummaryHeader.tsx`

Displays bill metadata (business name, date) and action buttons (view receipt, share).

#### `AllocationTable.tsx`

Renders the table showing each participant's total with breakdown modals.

#### `ItemizedBreakdownModal.tsx`

Modal dialog showing detailed breakdown for a specific participant.

#### `FullReceiptModal.tsx`

Modal dialog showing the complete receipt with all items.

### Hooks

#### `useBillAllocation.ts`

Manages bill allocation calculation from form data.

**Returns:**

- `allocation: BillAllocation | null` - Calculated allocation result
- `isLoading: boolean` - Loading state during calculation
- `error: Error | null` - Any error that occurred

#### `useBillSharing.ts`

Manages bill sharing functionality including saving to database and generating share URLs.

**Returns:**

- `shareUrl: string` - Generated share URL
- `fullUrl: string` - Current page URL
- `isOpen: boolean` - Share modal open state
- `setIsOpen: (open: boolean) => void` - Control modal state
- `handleShare: () => Promise<void>` - Trigger share flow
- `isSaving: boolean` - Saving state
- `mutation: UseMutationResult` - React Query mutation object

### Utils

#### `formatters.ts`

Utility functions for formatting data.

**Functions:**

- `roundCents(amount?: number): string` - Format currency to 2 decimal places
- `formatDate(date: Date | string): string` - Format date for display

#### `billCalculations.ts`

Business logic for bill calculations.

**Functions:**

- `calculateBillTotals(formData: FormData): { subtotal: number, total: number }` - Calculate bill totals

## Architecture Benefits

### Separation of Concerns

- **UI Components**: Pure presentational components focused on rendering
- **Custom Hooks**: Encapsulate business logic and state management
- **Utilities**: Reusable helper functions

### Reusability

- Components can be reused in different contexts
- Hooks can be used independently in other features
- Utilities are pure functions that can be tested and reused

### Maintainability

- Each file has a single, clear responsibility
- Changes to UI don't affect business logic and vice versa
- Easy to locate and modify specific functionality

### Testability

- Hooks can be tested independently with `@testing-library/react-hooks`
- Pure utility functions are easy to unit test
- UI components can be tested with snapshot or integration tests

## Usage Example

```tsx
import Summary from "@/features/bill-splitting/components/Summary";
import { FormData } from "@/lib/validation/formSchema";

function MyComponent({ formData }: { formData: FormData }) {
  return <Summary formData={formData} />;
}

// Or with an existing bill ID
function ExistingBill({
  formData,
  billId,
}: {
  formData: FormData;
  billId: string;
}) {
  return <Summary formData={formData} billId={billId} />;
}
```

## Dependencies

- `@tanstack/react-query` - For async state management
- `sonner` - For toast notifications
- `lucide-react` - For icons
- UI components from `@/components/ui`
