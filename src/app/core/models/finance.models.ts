export interface Income {
  id: string;
  label: string;
  amount: number;
  isFixed: boolean;
  receiptDay: number;  // fixed incomes only — day of month (1-31)
  date?: string;       // variable incomes only — ISO YYYY-MM-DD
  /** Months (0=Jan … 11=Dec) this income is active. If empty, active all year. Fixed only. */
  activeMonths: number[];
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
  /** Months (0=Jan … 11=Dec) this expense is active. If empty, active all year. Fixed only. */
  activeMonths: number[];
  dueDay: number;        // day of month (1-31), fixed expenses only
  date?: string;         // ISO YYYY-MM-DD, variable expenses only
  occurrences?: number;  // how many consecutive months to repeat, variable expenses only (default 1)
}

export interface MonthSummary {
  month: number; // 0-11
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;          // income - expenses for this month only
  accumulatedBalance: number; // balance carried from all previous months
  usagePercent: number;
}

export interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  startMonth: number; // 0=Jan … 11=Dec — months before this are ignored in projections
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
