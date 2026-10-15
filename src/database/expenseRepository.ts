import type { SQLiteDatabase } from 'expo-sqlite';
import { CATEGORIES, type Category, type Expense } from '@/types/expense';

interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function rowToExpense(row: ExpenseRow): Expense {
  const date = new Date(row.date);
  if (!isCategory(row.category) || !Number.isFinite(date.getTime())) {
    throw new Error(`Invalid expense data in database for expense "${row.id}"`);
  }

  return {
    id: row.id,
    amount: row.amount,
    category: row.category,
    date,
    description: row.description ?? undefined,
  };
}

export async function getAllExpenses(db: SQLiteDatabase): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT id, amount, category, date, description FROM expenses ORDER BY date DESC'
  );

  return rows.map(rowToExpense);
}

export async function insertExpense(
  db: SQLiteDatabase,
  expense: Expense
): Promise<void> {
  await db.runAsync(
    'INSERT INTO expenses (id, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
    expense.id,
    expense.amount,
    expense.category,
    expense.date.toISOString(),
    expense.description ?? null
  );
}
