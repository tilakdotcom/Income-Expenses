import { z } from "zod";

export const newAccount = z.object({
  name: z.string().min(3),
  amount: z.string().min(3),
  accountNumber: z.string().min(3),
});
