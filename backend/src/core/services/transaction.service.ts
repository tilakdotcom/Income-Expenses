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
  const toAccount = toAccountExistsResult.rows[0];
  appAssert(fromAccount || toAccount, BAD_REQUEST, "Account must exist");
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

  const fromDescription = `${data.amount} (Transfer to ${toAccount.account_name})`;
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

  const toDescription = `${data.amount} (Received from ${fromAccount.account_name})`;

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

export const getDashboardService = async (userId: string) => {
  let totalIncome = 0;
  let totalExpense = 0;
  const transactionsQuery = {
    text: `SELECT SUM(amount) as total_income FROM tbltransaction WHERE user_id=$1 GROUP BY transaction_type`,
    values: [userId],
  };

  const transactionsResult = await pool.query(transactionsQuery);
  const transactions = transactionsResult.rows;

  transactions.forEach((transaction) => {
    if (transaction.transaction_type === "income") {
      totalIncome += transaction.total_income;
    } else {
      totalExpense += transaction.total_income;
    }
  });

  const availableBalance = totalIncome - totalExpense;

  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const resultQuery = {
    text: `SELECT EXTRACT(MONTH FROM created_at) as month,
    transaction_type,
    SUM(amount) as total_amount
    FROM tbltransaction
    WHERE user_id=$1 AND created_at BETWEEN $2 AND $3
    GROUP BY EXTRACT(MONTH FROM created_at), transaction_type
    `,
    values: [userId, startDate, endDate],
  };

  const result = await pool.query(resultQuery);

  //organise Data
  const data = new Array(12).map((_, index) => {
    const month = result.rows.filter(
      (item) => parseInt(item.month) === index + 1
    );

    const income = month.filter((item) => item.transaction_type === "income");
    const expense = month.filter((item) => item.transaction_type === "expense");
    return {
      month: getMonthNames(index),
      income: income.reduce((acc, curr) => acc + curr.total_amount, 0),
      expense: expense.reduce((acc, curr) => acc + curr.total_amount, 0),
    };
  });

  const lastTransactionQuery = {
    text: `SELECT *
    FROM tbltransaction
    WHERE user_id=$1 
    ORDER BY id DESC
    LIMIT 4`,
    values: [userId],
  };


  const lastTransactions = await pool.query(lastTransactionQuery);

  const lastActiveAccountQuery = {
    text: `SELECT * FROM tblaccount WHERE user_id=$1 ORDER BY id DESC LIMIT 4`,
    values: [userId],
  }
  const lastActiveAccounts = await pool.query(lastActiveAccountQuery);



  return {
    totalIncome,
    totalExpense,
    availableBalance,
    chartData : data,
    lastTransactions: lastTransactions.rows,
    lastActiveAccounts: lastActiveAccounts.rows,
  };
};

function getMonthNames(index: number) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[index];
}
