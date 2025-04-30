# Tabulate 🧾💸

Effortlessly divide complex restaurant bills, including proportional taxes, tips, and discounts, among multiple payers—ensuring fair allocation every time, even with shared items!

## The Problem It Solves

Splitting restaurant bills, especially when some items are shared among different groups of people, can be tedious and prone to errors. Calculating everyone's fair share, including proportional tax and tip, often required manual spreadsheets, which wasn't always user-friendly, particularly for less tech-savvy individuals. Existing tools sometimes felt clunky, produced unexpected results, or lacked robust receipt scanning capabilities.

Tabulate was born out of this frustration, aiming to provide a straightforward, user-friendly solution for the common scenario of fairly dividing group meal costs. While it may not cover every edge case, it effectively handles the vast majority (~80%) of typical restaurant bill-splitting situations.

## Live Demo 🚀

Check out the live version deployed on Vercel:

**[https://tabulate.vercel.app/](https://tabulate.vercel.app/)**

<!-- Optional: Add a screenshot or GIF here! -->
<!-- ![Tabulate Screenshot](path/to/your/screenshot.png) -->

## Key Features ✨

- **Receipt Upload (OCR):** Upload a receipt image and Tabulate (using Google Gemini 2.0) attempts to automatically extract items and prices.
- **Manual Item Entry:** Easily add or edit bill items manually.
- **Flexible Payer Assignment:** Assign entire items or shares of items to multiple payers.
- **Shared Item Handling:** Accurately splits the cost of items shared by several people.
- **Proportional Tax & Tip Calculation:** Automatically calculates and adds each person's share of taxes and tips based on their subtotal.
- **Discount Application:** Apply discounts fairly across relevant items/payers.
- **Clear Summary:** Provides a clear breakdown of what each person owes.
- **User-Friendly Interface:** Designed for ease of use, even for those not comfortable with spreadsheets.
- **Link-Sharing:** Easily generate a sharable link which list how much each person owes and a detailed breakdown.

## Technology Stack 🛠️

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- **UI Components:** [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) (Toasts), [React Day Picker](https://react-day-picker.js.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Backend & Database:** [Supabase](https://supabase.com/)
- **Data Fetching/State Management:** [TanStack Query](https://tanstack.com/query/latest)
- **Receipt Scanning (OCR):** [Google Gemini 2.0](https://ai.google.dev/)
- **Deployment:** [Vercel](https://vercel.com/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)

## Getting Started ⚙️

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/daniel-yili-ye/Tabulate.git
    cd tabulate
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```
3.  **Set up Environment Variables:**
    - Create a `.env.local` file in the root directory.
    - Add the necessary environment variables. You'll likely need Supabase URL, Supabase Anon Key, and a Google Gemini API Key. Refer to Supabase and Google AI documentation for obtaining these.
      ```plaintext
      # .env.local example
      NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY
      # Add any other required variables
      ```
4.  **Set up Supabase:**

    - Create a new project on [Supabase](https://supabase.com/).
    - **Database Table:** Navigate to the Table Editor and create the `bills` table with the following schema. You can use the SQL editor with the snippet below:

      ```sql
      -- 1. Create the table
      CREATE TABLE public.bills (
        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        form_data jsonb NULL,
        allocation jsonb NULL
      );

      -- 2. Enable Row Level Security (RLS)
      ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

      -- 3. Create policies for public access
      -- Allow anyone to insert a new bill
      CREATE POLICY "Allow public insert access" ON public.bills FOR INSERT TO public WITH CHECK (true);

      -- Allow anyone to read any bill (e.g., via shared link using ID)
      CREATE POLICY "Allow public read access" ON public.bills FOR SELECT TO public USING (true);
      ```

    - **Storage Bucket:** Navigate to Storage, create a new bucket named `receipt-images`, and **make it public**. This allows uploaded receipt images to be viewed by anyone with the link.
      - _Important Security Note:_ Public buckets allow anyone to view or download files if they have the URL. Ensure no sensitive information is stored here or consider more restrictive policies if needed.
    - **API Keys:** Find your project's API URL and `anon` key in the API settings and add them to your `.env.local` file (see step 3).

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Future Improvements 💡

- Handling more complex discount scenarios (e.g., item-specific discounts, item-specific % allocation across users).
- User accounts for saving past bills.
- Ability to editing published bill splits.
- Drizzle ORM support for better db schema maintainability and reproducibility.
- Support for multiple currencies.
- Integration with payment platforms (e.g., E-transfer, Venmo, PayPal).
