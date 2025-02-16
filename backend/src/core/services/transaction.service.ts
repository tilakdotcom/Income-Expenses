import appAssert from "../../common/API/AppAssert";
import { BAD_REQUEST } from "../../constants/http";
import pool from "../../database/db/dbConnect";

type addTransactionServiceType = {
  userId: String;
  accountId: String;
  description: String;
  source: String;
  amount: String;
};

export const addTransactionService = async (
  data: addTransactionServiceType
) => {
  appAssert(
    Number(data.amount) <= 0,
    BAD_REQUEST,
    "amount must be greater than zero"
  );
  const accountExistsQuery = {
    text: `SELECT * FROM tblaccount WHERE id=$1 AND user_id =$2`,
    values: [data.accountId, data.userId],
  };
  const accountExistsResult = await pool.query(accountExistsQuery);
  const account = accountExistsResult.rows[0];
  appAssert(account, BAD_REQUEST, "Account must exist");
  appAssert(
    account.account_balance <= 0 ||
      account.account_balance < Number(data.amount),
    BAD_REQUEST,
    "Insufficient Amount to add transaction"
  );

  await pool.query("BEGIN");

  const updateAccountQuery = {
    text: `UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id=$2 AND user_id = $3`,
    values: [data.amount, data.accountId, data.userId],
  };
  await pool.query(updateAccountQuery);
  const description = `${data.description} (Transfer from ${data.source})`;
  const createTransactionQuery = {
    text: `INSERT INTO tbltransaction (account_id, user_id, description, amount, account_id, status,  transaction_type, updated_at=CURRENT_TIMESTAMP) VALUES ($1, $2, $3, $4, $5)`,
    values: [
      data.accountId,
      data.userId,
      description,
      data.amount,
      account.id,
      "completed",
      "expense",
    ],
  };
  await pool.query(createTransactionQuery);

  await pool.query("COMMIT");
};

type transferMoneyServiceType = {
  fromAccount: String;
  toAccount: String;
  amount: String;
  userId: String;
};

export const transferMoneyService = async (data: transferMoneyServiceType) => {
  appAssert(
    Number(data.amount) <= 0,
    BAD_REQUEST,
    "amount must be greater than zero"
  );

  const fromAccountExistsQuery = {
    text: `SELECT * FROM tblaccount WHERE id=$1 AND user_id =$2`,
    values: [data.fromAccount, data.userId],
  };

  const fromAccountExistsResult = await pool.query(fromAccountExistsQuery);
  const toAccountExistsQuery = {
    text: `SELECT * FROM tblaccount WHERE id=$1 AND user_id =$2`,
    values: [data.toAccount, data.userId],
  };
  const toAccountExistsResult = await pool.query(toAccountExistsQuery);

  const fromAccount = fromAccountExistsResult.rows[0];
  appAssert(
    fromAccount || toAccountExistsResult,
    BAD_REQUEST,
    "Account must exist"
  );
  appAssert(
    fromAccount.account_balance <= 0 ||
      fromAccount.account_balance < Number(data.amount),
    BAD_REQUEST,
    "Account balance is out of range"
  );

  await pool.query("BEGIN");

  const updateFromAccountQuery = {
    text: `UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id=$2 AND user_id = $3`,
    values: [data.amount, data.fromAccount, data.userId],
  };
  await pool.query(updateFromAccountQuery);

  const fromDescription = `${data.amount} (Transfer to ${data.toAccount})`;
  const newTransactionFromAccountQuery = {
    text: `INSERT INTO tbltransaction (account_id, user_id, description, amount, account_id, status,  transaction_type, updated_at=CURRENT_TIMESTAMP) VALUES ($1, $2, $3, $4, $5)`,
    values: [
      data.fromAccount,
      data.userId,
      fromDescription,
      data.amount,
      fromAccount.id,
      "completed",
      "expense",
    ],
  };
  await pool.query(newTransactionFromAccountQuery);

  const updateToAccountQuery = {
    text: `UPDATE tblaccount SET account_balance = account_balance + $1 WHERE id=$2 AND user_id = $3`,
    values: [data.amount, data.toAccount, data.userId],
  };

  await pool.query(updateToAccountQuery);

  const toDescription = `${data.amount} (Received from ${data.fromAccount})`;

  const newTransactionToAccountQuery = {
    text: `INSERT INTO tbltransaction (account_id, user_id, description, amount, account_id, status,  transaction_type, updated_at=CURRENT_TIMESTAMP) VALUES ($1, $2, $3, $4, $5)`,
    values: [
      data.fromAccount,
      data.userId,
      toDescription,
      data.amount,
      fromAccount.id,
      "completed",
      "income",
    ],
  };
  await pool.query(newTransactionToAccountQuery);

  await pool.query("COMMIT");
};
