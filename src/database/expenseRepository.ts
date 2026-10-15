import type { SQLiteDatabase } from 'expo-sqlite';
import { CATEGORIES, type Category, type Expense } from '@/types/expense';
import {
  getExpenseDateValidationError,
  isValidExpenseDescription,
} from '@/utils/expenseValidation';

interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  invoice_uri: string | null;
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function rowToExpense(row: ExpenseRow): Expense {
  const date = new Date(row.date);
  if (
    !isCategory(row.category) ||
    !Number.isFinite(date.getTime())
  ) {
    throw new Error(`Invalid expense data in database for expense "${row.id}"`);
  }

  return {
    id: row.id,
    amount: row.amount,
    category: row.category,
    date,
    description: row.description ?? undefined,
    invoiceUri: row.invoice_uri ?? undefined,
  };
}

export async function getAllExpenses(db: SQLiteDatabase): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT id, amount, category, date, description, invoice_uri FROM expenses ORDER BY date DESC'
  );

  return rows.map(rowToExpense);
}

function validateExpense(expense: Omit<Expense, 'id'>): void {
  if (
    !Number.isFinite(expense.amount) ||
    expense.amount <= 0 ||
    Number(expense.amount.toFixed(2)) !== expense.amount
  ) {
    throw new Error('Expense amount must be positive and have at most two decimals');
  }
  if (!isCategory(expense.category)) {
    throw new Error('Expense category is invalid');
  }
  if (!isValidExpenseDescription(expense.description)) {
    throw new Error('Expense description must be at most 400 letters, numbers, or spaces');
  }
  if (!(expense.date instanceof Date) || !Number.isFinite(expense.date.getTime())) {
    throw new Error('Expense date is invalid');
  }
  if (getExpenseDateValidationError(expense.date)) {
    throw new Error('Expense date cannot be in the future');
  }
}

export async function insertExpense(
  db: SQLiteDatabase,
  expense: Expense
): Promise<void> {
  validateExpense(expense);
  await db.runAsync(
    'INSERT INTO expenses (id, amount, category, date, description, invoice_uri) VALUES (?, ?, ?, ?, ?, ?)',
    expense.id,
    expense.amount,
    expense.category,
    expense.date.toISOString(),
    expense.description ?? null,
    expense.invoiceUri ?? null
  );
}

export async function updateExpense(
  db: SQLiteDatabase,
  expense: Expense
): Promise<void> {
  validateExpense(expense);
  const result = await db.runAsync(
    'UPDATE expenses SET amount = ?, category = ?, date = ?, description = ?, invoice_uri = ? WHERE id = ?',
    expense.amount,
    expense.category,
    expense.date.toISOString(),
    expense.description ?? null,
    expense.invoiceUri ?? null,
    expense.id
  );
  if (result.changes !== 1) {
    throw new Error(`Expense "${expense.id}" was not found for update`);
  }
}

export async function deleteExpense(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  const result = await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
  if (result.changes !== 1) {
    throw new Error(`Expense "${id}" was not found for deletion`);
  }
}
