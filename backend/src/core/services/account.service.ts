import appAssert from "../../common/API/AppAssert";
import { BAD_REQUEST } from "../../constants/http";
import pool from "../../database/db/dbConnect";

type createAccountServiceType = {
  userId: string;
  name: string;
  amount: string;
  accountNumber: string;
};

export const createAccountService = async (data: createAccountServiceType) => {
  const acountExistQuery = {
    text: `SELECT * FROM tblaccount WHERE account_name=$1 AND user_id =$2`,
    values: [data.name, data.userId],
  };

  const accountExistsResult = await pool.query(acountExistQuery);

  const account = accountExistsResult.rows[0];
  appAssert(!account, BAD_REQUEST, "Account already exists");

  const createAccountQuery = {
    text: `INSERT INTO tblaccount (account_name, user_id, account_balance, account_number) VALUES ($1, $2, $3, $4) RETURNING *`,
    values: [data.name, data.userId, data.amount, data.accountNumber],
  };

  const newAccountResult = await pool.query(createAccountQuery);
  const newAccount = newAccountResult.rows[0];

  const userAccount = Array.isArray(data.name) ? data.name : [data.name];

  const userUpdateQuery = {
    text: `UPDATE tbluser SET accounts = array_cat(accounts, $1), updated_at=CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    values: [userAccount, data.userId],
  };

  const updateUserResult = await pool.query(userUpdateQuery);
  const updatedUser = updateUserResult.rows[0];

  const description = account.account_name + " (Initail Deposit)";
  const initialDepositQuery = {
    text: `INSERT INTO tbltransaction (user_id, description, status, amount, transaction_type, account_id) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING *`,
    values: [
      data.userId,
      description,
      "complete",
      data.amount,
      "income",
      newAccount.account_name,
    ],
  };

  const initialDepositResult = await pool.query(initialDepositQuery);
  const initialDeposit = initialDepositResult.rows[0];

  return {
    newAccount,
    updatedUser,
    initialDeposit,
  };
};

type addAmountServiceType = {
  userId: string;
  accountId: string;
  amount: string;
};

export const addAmountService = async (data: addAmountServiceType) => {
  const accountExistsQuery = {
    text: `SELECT * FROM tblaccount WHERE id=$1 AND user_id =$2`,
    values: [data.accountId, data.userId],
  };
  const accountExistsResult = await pool.query(accountExistsQuery);
  const accountExists = accountExistsResult.rows[0];
  appAssert(accountExists, BAD_REQUEST, "account does not exists");

  const updateAddAmountQuery = {
    text: "UPDATE tblaccount SET account_balance=$1 WHERE user_id = $2 AND id =$3 RETURNING *",
    values: [data.accountId, data.userId, data.accountId],
  };
  const updateAddAmountResult = await pool.query(updateAddAmountQuery);
  const updateAddAmount = updateAddAmountResult.rows[0];
  const description = accountExists.account_name + " (Deposit)";
  const newDepositQuery = {
    text: `INSERT INTO tbltransaction (user_id, description, status, amount, transaction_type, account_id) VALUES ($1, $2, $3, $4, $5, updated_at=CURRENT_TIMESTAMP) RETURNING *`,
    values: [
      data.userId,
      description,
      "complete",
      data.amount,
      "income",
      updateAddAmount.id,
    ],
  };

  const newDepositResult = await pool.query(newDepositQuery);
  const newDeposit = newDepositResult.rows[0];

  return {
    updateAddAmount,
    newDeposit,
  };
};
