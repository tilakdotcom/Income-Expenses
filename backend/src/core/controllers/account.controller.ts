import appAssert from "../../common/API/AppAssert";
import { newAccount } from "../../common/schemas/account";
import { BAD_REQUEST, CREATED, OK } from "../../constants/http";
import pool from "../../database/db/dbConnect";
import asyncHandler from "../../middlewares/asyncHandler.middleware";
import { createAccountService } from "../services/account.service";

export const getAccountHandler = asyncHandler(async (req, res) => {
  const userId = req.userId as string;
  const accountExists = await pool.query({
    text: `SELECT * FROM tblaccount WHERE  user_id =$1`,
    values: [userId],
  });
  const account = accountExists.rows;
  appAssert(account, BAD_REQUEST, "Accounts not found");

  return res.status(OK).json({
    message: "Account details",
    data: account,
  });
});

export const createAccountHandler = asyncHandler(async (req, res) => {
  const body = newAccount.parse(req.body);
  const userId = req.userId as string;
  const { newAccount: newAccountResult, updatedUser } = await createAccountService({
    userId,
    name: body.name,
    amount: body.amount,
    accountNumber: body.accountNumber,
  });
  return res.status(CREATED).json({
    message: "Account created successfully",
    data:{
      newAccount: newAccountResult,
      user: updatedUser,
    },
  });
});
