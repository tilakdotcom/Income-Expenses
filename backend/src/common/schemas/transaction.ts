import { z } from "zod";

export const addTransactionSchema = z.object({
  description: z.string().min(3),
  amount: z.string().min(2),
});

export const tranferMoneyFromAccountSchema = z.object({
  fromAccount: z.string(),
  toAccount: z.string(),
  amount: z.string().min(2),
})