import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import {
  CashFlowEvent,
  Expense,
  FinanceState,
  Fortnight,
  Income,
  MonthSummary,
} from '../models/finance.models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private storage = inject(StorageService);
  private state = signal<FinanceState>({ incomes: [], expenses: [], startMonth: 0 });

  /** Called by APP_INITIALIZER — loads data from API before app renders */
  init(): Observable<void> {
    return this.storage.load().pipe(
      tap(data => this.state.set(this._migrate(data))),
      map(() => void 0),
    );
  }

  readonly incomes = computed(() => this.state().incomes);
  readonly fixedIncomes = computed(() => this.state().incomes.filter(i => i.isFixed));
  readonly variableIncomes = computed(() => this.state().incomes.filter(i => !i.isFixed));
  readonly expenses = computed(() => this.state().expenses);

  /** Sum of fixed incomes only — used as the monthly baseline for alerts/usage % */
  readonly totalIncome = computed(() =>
    this.fixedIncomes().reduce((sum, i) => sum + i.amount, 0)
  );

  incomesForMonth(month: number, year = new Date().getFullYear()): Income[] {
    return this.state().incomes.filter(i => {
      if (i.isFixed) {
        return i.activeMonths.length === 0 || i.activeMonths.includes(month);
      }
      if (!i.date) return false;
      const d = new Date(i.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  readonly fixedExpenses = computed(() =>
    this.state().expenses.filter(e => e.isFixed)
  );

  readonly variableExpenses = computed(() =>
    this.state().expenses.filter(e => !e.isFixed)
  );

  /** Expenses active in a given month (0=Jan…11=Dec) */
  expensesForMonth(month: number, year = new Date().getFullYear()): Expense[] {
    return this.state().expenses.filter(e => {
      if (e.isFixed) {
        return e.activeMonths.length === 0 || e.activeMonths.includes(month);
      }
      // Variable: check if this month/year falls within the occurrence window
      if (!e.date) return false;
      const origin = new Date(e.date + 'T00:00:00');
      const originIndex = origin.getFullYear() * 12 + origin.getMonth();
      const targetIndex = year * 12 + month;
      const occurrences = e.occurrences ?? 1;
      return targetIndex >= originIndex && targetIndex < originIndex + occurrences;
    });
  }

  summaryForMonth(month: number, year = new Date().getFullYear(), carryOver = 0): MonthSummary {
    const totalIncome = this.incomesForMonth(month, year).reduce((s, i) => s + i.amount, 0);
    const totalExpenses = this.expensesForMonth(month, year).reduce((s, e) => s + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    const usagePercent = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    return { month, year, totalIncome, totalExpenses, balance, accumulatedBalance: carryOver + balance, usagePercent };
  }

  readonly startMonth = computed(() => this.state().startMonth);

  annualProjection(year = new Date().getFullYear()): MonthSummary[] {
    const start = this.state().startMonth;
    let carry = 0;
    return Array.from({ length: 12 }, (_, m) => {
      if (m < start) {
        return { month: m, year, totalIncome: 0, totalExpenses: 0, balance: 0, accumulatedBalance: 0, usagePercent: 0 };
      }
      const summary = this.summaryForMonth(m, year, carry);
      carry = summary.accumulatedBalance;
      return summary;
    });
  }

  setStartMonth(month: number): void {
    this.update(s => ({ ...s, startMonth: month }));
  }

  /** Variable expense alert: flags expenses whose amount exceeds threshold */
  variableAlerts(threshold = 0.1): Expense[] {
    const total = this.totalIncome();
    return this.variableExpenses().filter(e => total > 0 && e.amount / total > threshold);
  }

  toggleIncomeMonth(incomeId: string, month: number): void {
    this.update(s => ({
      ...s,
      incomes: s.incomes.map(i => {
        if (i.id !== incomeId || !i.isFixed) return i;
        if (i.activeMonths.length === 0) {
          return { ...i, activeMonths: Array.from({ length: 12 }, (_, m) => m).filter(m => m !== month) };
        }
        const active = i.activeMonths.includes(month)
          ? i.activeMonths.filter(m => m !== month)
          : [...i.activeMonths, month];
        return { ...i, activeMonths: active };
      }),
    }));
  }

  /**
   * Returns the two fortnights for the given month/year.
   * Fortnight 1: days 1-14 | Fortnight 2: days 15-end-of-month
   */
  cashFlowForMonth(month: number, year = new Date().getFullYear()): Fortnight[] {
    const activeExpenses = this.expensesForMonth(month, year);

    const expenseDay = (e: Expense) =>
      e.isFixed ? (e.dueDay ?? 1) : (e.date ? new Date(e.date + 'T00:00:00').getDate() : 1);

    const activeIncomes = this.incomesForMonth(month, year);
    const incomeDay = (i: Income) =>
      i.isFixed ? (i.receiptDay ?? 1) : (i.date ? new Date(i.date + 'T00:00:00').getDate() : 1);

    // Fortnight 1: days 1-14
    const fn1Incomes = activeIncomes.filter(i => incomeDay(i) <= 14);
    const fn1Expenses = activeExpenses.filter(e => expenseDay(e) <= 14);
    const fn1TotalIncome = fn1Incomes.reduce((s, i) => s + i.amount, 0);
    const fn1TotalExpenses = fn1Expenses.reduce((s, e) => s + e.amount, 0);
    const fn1Balance = fn1TotalIncome - fn1TotalExpenses;

    const fortnight1: Fortnight = {
      label: '1ª Quinzena',
      startDay: 1,
      endDay: 14,
      incomes: fn1Incomes,
      expenses: fn1Expenses,
      totalIncome: fn1TotalIncome,
      totalExpenses: fn1TotalExpenses,
      balance: fn1Balance,
      accumulatedBalance: 0,
    };

    // Fortnight 2: days 15-31
    const fn2Incomes = activeIncomes.filter(i => incomeDay(i) >= 15);
    const fn2Expenses = activeExpenses.filter(e => expenseDay(e) >= 15);
    const fn2TotalIncome = fn2Incomes.reduce((s, i) => s + i.amount, 0);
    const fn2TotalExpenses = fn2Expenses.reduce((s, e) => s + e.amount, 0);
    const fn2Balance = fn2TotalIncome - fn2TotalExpenses;

    const fortnight2: Fortnight = {
      label: '2ª Quinzena',
      startDay: 15,
      endDay: 31,
      incomes: fn2Incomes,
      expenses: fn2Expenses,
      totalIncome: fn2TotalIncome,
      totalExpenses: fn2TotalExpenses,
      balance: fn2Balance,
      accumulatedBalance: fn1Balance,
    };

    return [fortnight1, fortnight2];
  }

  /**
   * Returns all cash flow events for the month sorted by day.
   */
  cashFlowEventsForMonth(month: number, year = new Date().getFullYear(), initialBalance = 0): CashFlowEvent[] {
    const activeExpenses = this.expensesForMonth(month, year);
    const events: Omit<CashFlowEvent, 'runningBalance'>[] = [];

    for (const income of this.incomesForMonth(month, year)) {
      const day = income.isFixed
        ? (income.receiptDay ?? 1)
        : (income.date ? new Date(income.date + 'T00:00:00').getDate() : 1);
      events.push({ day, type: 'income', label: income.label, amount: income.amount });
    }

    for (const expense of activeExpenses) {
      const day = expense.isFixed
        ? (expense.dueDay ?? 1)
        : (expense.date ? new Date(expense.date + 'T00:00:00').getDate() : 1);
      events.push({
        day,
        type: 'expense',
        label: expense.label,
        amount: expense.amount,
      });
    }

    // Sort by day, incomes before expenses on same day
    events.sort((a, b) => a.day !== b.day ? a.day - b.day : a.type === 'income' ? -1 : 1);

    let running = initialBalance;
    return events.map(e => {
      running += e.type === 'income' ? e.amount : -e.amount;
      return { ...e, runningBalance: running };
    });
  }

  // --- Mutations ---

  addIncome(income: Omit<Income, 'id'>): void {
    this.update(s => ({
      ...s,
      incomes: [...s.incomes, { ...income, id: crypto.randomUUID() }],
    }));
  }

  updateIncome(id: string, changes: Partial<Omit<Income, 'id'>>): void {
    this.update(s => ({
      ...s,
      incomes: s.incomes.map(i => (i.id === id ? { ...i, ...changes } : i)),
    }));
  }

  removeIncome(id: string): void {
    this.update(s => ({ ...s, incomes: s.incomes.filter(i => i.id !== id) }));
  }

  addExpense(expense: Omit<Expense, 'id'>): void {
    this.update(s => ({
      ...s,
      expenses: [...s.expenses, { ...expense, id: crypto.randomUUID() }],
    }));
  }

  updateExpense(id: string, changes: Partial<Omit<Expense, 'id'>>): void {
    this.update(s => ({
      ...s,
      expenses: s.expenses.map(e => (e.id === id ? { ...e, ...changes } : e)),
    }));
  }

  removeExpense(id: string): void {
    this.update(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) }));
  }

  toggleExpenseMonth(expenseId: string, month: number): void {
    this.update(s => ({
      ...s,
      expenses: s.expenses.map(e => {
        if (e.id !== expenseId) return e;
        const active = e.activeMonths.includes(month)
          ? e.activeMonths.filter(m => m !== month)
          : [...e.activeMonths, month];
        return { ...e, activeMonths: active };
      }),
    }));
  }

  private update(fn: (s: FinanceState) => FinanceState): void {
    const next = fn(this.state());
    this.state.set(next);
    this.storage.save(next);
  }

  /** Migrate existing data that may be missing new fields */
  private _migrate(state: FinanceState): FinanceState {
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...state,
      startMonth: state.startMonth ?? 0,
      incomes: state.incomes.map(i => ({
        ...i,
        isFixed: i.isFixed ?? true,
        receiptDay: i.receiptDay ?? 1,
        activeMonths: i.activeMonths ?? [],
      })),
      expenses: state.expenses.map(e => ({
        ...e,
        dueDay: e.dueDay ?? 1,
        ...(e.isFixed ? {} : { date: e.date ?? today, occurrences: e.occurrences ?? 1 }),
      })),
    };
  }
}
