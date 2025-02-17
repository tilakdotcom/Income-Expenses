import {
  addTransactionSchema,
  tranferMoneyFromAccountSchema,
} from "../../common/schemas/transaction";
import { sevenDayAgo } from "../../common/utils/customTime";
import { OK } from "../../constants/http";
import pool from "../../database/db/dbConnect";
import asyncHandler from "../../middlewares/asyncHandler.middleware";
import {
  addTransactionService,
  getDashboardService,
  transferMoneyService,
} from "../services/transaction.service";

export const getTransactionHandler = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { sd, ed, s } = req.query;
  const sevenDayBack = sevenDayAgo();

  const startDate = new Date(Number.parseInt(sd as string) || sevenDayBack);
  const endDate = new Date(Number.parseInt(ed as string) || new Date());

  const transactionGetQuery = {
    text: `
      SELECT * FROM tbltransaction 
      WHERE user_id = $1 
      AND created_at BETWEEN $2 AND $3 
      AND (
        description ILIKE '%'|| $4 || '%' 
        OR status ILIKE '%' || $4 || '%' 
        OR transaction_type ILIKE '%' || $4 || '%'
      ) 
      ORDER BY id DESC
    `,
    values: [userId, startDate, endDate, s || ""],
  };

  const getTransactionsResult = await pool.query(transactionGetQuery);

  return res.status(OK).json({
    message: "Transactions fetched successfully",
    data: getTransactionsResult.rows,
    totalCount: getTransactionsResult.rowCount,
  });
});

export const addTransactionHandler = asyncHandler(async (req, res) => {
  const body = addTransactionSchema.parse(req.body);
  const userId = req.userId as string;
  const accountId = req.params.accountId as string;

  await addTransactionService({
    userId,
    accountId,
    description: body.description,
    amount: body.amount,
  });

  return res.status(OK).json({ message: "Transaction added successfully" });
});

export const transferMoneyHandler = asyncHandler(async (req, res) => {
  const userId = req.userId as string;
  const body = tranferMoneyFromAccountSchema.parse(req.body);

  await transferMoneyService({
    userId,
    fromAccount: body.fromAccount,
    toAccount: body.toAccount,
    amount: body.amount,
  });

  return res.status(OK).json({ message: "Transferred successfully" });
});

export const getDashboardHandler = asyncHandler(async (req, res) => {
  const userId = req.userId as string;

  const {
    availableBalance,
    chartData,
    lastActiveAccounts,
    lastTransactions,
    totalExpense,
    totalIncome,
  } = await getDashboardService(userId);

  return res.status(OK).json({
    message: "Dashboard fetched successfully",
    data: {
      availableBalance,
      chartData,
      lastActiveAccounts,
      lastTransactions,
      totalExpense,
      totalIncome,
    },
  });
});
