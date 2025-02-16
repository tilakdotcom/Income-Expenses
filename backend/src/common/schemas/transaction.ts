import { z } from "zod";

export const addTransactionSchema = z.object({
  description: z.string().min(3),
  source: z.string().min(3),
  amount: z.string().min(2),
});