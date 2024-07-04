import * as z from "zod";
import { formSchema } from "./formSchema";

export const allocationSchema = z.array(z.array(z.string()).min(1));

export type AllocationData = z.infer<typeof formSchema>;
