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
  private state = signal<FinanceState>({ incomes: [], expenses: [] });

  /** Called by APP_INITIALIZER — loads data from API before app renders */
  init(): Observable<void> {
    return this.storage.load().pipe(
      tap(data => this.state.set(this._migrate(data))),
      map(() => void 0),
    );
  }

  readonly incomes = computed(() => this.state().incomes);
  readonly expenses = computed(() => this.state().expenses);

  readonly totalIncome = computed(() =>
    this.state().incomes.reduce((sum, i) => sum + i.amount, 0)
  );

  readonly fixedExpenses = computed(() =>
    this.state().expenses.filter(e => e.isFixed)
  );

  readonly variableExpenses = computed(() =>
    this.state().expenses.filter(e => !e.isFixed)
  );

  /** Expenses active in a given month (0=Jan…11=Dec) */
  expensesForMonth(month: number): Expense[] {
    return this.state().expenses.filter(
      e => e.activeMonths.length === 0 || e.activeMonths.includes(month)
    );
  }

  summaryForMonth(month: number, year = new Date().getFullYear()): MonthSummary {
    const totalIncome = this.totalIncome();
    const totalExpenses = this.expensesForMonth(month).reduce((s, e) => s + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    const usagePercent = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    return { month, year, totalIncome, totalExpenses, balance, usagePercent };
  }

  annualProjection(year = new Date().getFullYear()): MonthSummary[] {
    return Array.from({ length: 12 }, (_, m) => this.summaryForMonth(m, year));
  }

  /** Variable expense alert: flags expenses whose amount exceeds threshold */
  variableAlerts(threshold = 0.1): Expense[] {
    const total = this.totalIncome();
    return this.variableExpenses().filter(e => total > 0 && e.amount / total > threshold);
  }

  /**
   * Returns the two fortnights for the given month/year.
   * Fortnight 1: days 1-14 | Fortnight 2: days 15-end-of-month
   */
  cashFlowForMonth(month: number, year = new Date().getFullYear()): Fortnight[] {
    const activeExpenses = this.expensesForMonth(month);

    // Fortnight 1: days 1-14
    const fn1Incomes = this.state().incomes.filter(i => (i.receiptDay ?? 1) <= 14);
    const fn1Expenses = activeExpenses.filter(e => (e.dueDay ?? 1) <= 14);
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
    const fn2Incomes = this.state().incomes.filter(i => (i.receiptDay ?? 1) >= 15);
    const fn2Expenses = activeExpenses.filter(e => (e.dueDay ?? 1) >= 15);
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
  cashFlowEventsForMonth(month: number, year = new Date().getFullYear()): CashFlowEvent[] {
    const activeExpenses = this.expensesForMonth(month);
    const events: Omit<CashFlowEvent, 'runningBalance'>[] = [];

    for (const income of this.state().incomes) {
      events.push({
        day: income.receiptDay ?? 1,
        type: 'income',
        label: income.label,
        amount: income.amount,
      });
    }

    for (const expense of activeExpenses) {
      events.push({
        day: expense.dueDay ?? 1,
        type: 'expense',
        label: expense.label,
        amount: expense.amount,
      });
    }

    // Sort by day, incomes before expenses on same day
    events.sort((a, b) => a.day !== b.day ? a.day - b.day : a.type === 'income' ? -1 : 1);

    let running = 0;
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
    return {
      ...state,
      incomes: state.incomes.map(i => ({ ...i, receiptDay: i.receiptDay ?? 1 })),
      expenses: state.expenses.map(e => ({ ...e, dueDay: e.dueDay ?? 1 })),
    };
  }
}
