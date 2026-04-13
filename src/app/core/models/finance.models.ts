export interface Income {
  id: string;
  label: string;
  amount: number;
  receiptDay: number; // day of month (1-31)
}

export type ExpenseCategory =
  | 'housing'
  | 'transport'
  | 'food'
  | 'health'
  | 'education'
  | 'leisure'
  | 'subscriptions'
  | 'other';

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  isFixed: boolean;
  /** Months (0=Jan … 11=Dec) this expense is active. If empty, active all year. */
  activeMonths: number[];
  dueDay: number; // day of month (1-31), default 1
}

export interface MonthSummary {
  month: number; // 0-11
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  usagePercent: number;
}

export interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
}

export interface CashFlowEvent {
  day: number;
  type: 'income' | 'expense';
  label: string;
  amount: number;
  runningBalance: number;
}

export interface Fortnight {
  label: string; // '1ª Quinzena' | '2ª Quinzena'
  startDay: number;
  endDay: number;
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  accumulatedBalance: number; // balance carried from previous period
}
