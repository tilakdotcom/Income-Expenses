import { sevenDayAgo } from "../../common/utils/customTime";
import { OK } from "../../constants/http";
import pool from "../../database/db/dbConnect";
import asyncHandler from "../../middlewares/asyncHandler.middleware";

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
