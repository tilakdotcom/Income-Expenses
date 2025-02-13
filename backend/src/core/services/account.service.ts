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

  const userAccount = Array.isArray(data.name)? data.name : [data.name]

  const userUpdateQuery = {
    text: `UPDATE tbluser SET accounts = array_cat(accounts, $1), updated_at=CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    values: [userAccount, data.userId],
  }

  const updateUserResult = await pool.query(userUpdateQuery)
  const updatedUser = updateUserResult.rows[0]

  return {
    newAccount,
    updatedUser
  };
};
