import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';

@Component({
  selector: 'app-budget',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss',
})
export class BudgetComponent {
  private finance = inject(FinanceService);

  readonly monthKeys = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  readonly monthShortKeys = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  readonly months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: this.monthKeys[i] }));
  readonly years = Array.from({ length: 2030 - new Date().getFullYear() + 1 }, (_, i) => new Date().getFullYear() + i);

  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedMonth = signal<number>(new Date().getMonth());

  readonly incomes = this.finance.fixedIncomes;
  readonly fixedExpenses = this.finance.fixedExpenses;
  readonly startMonth = this.finance.startMonth;
  readonly annualProjection = computed(() => this.finance.annualProjection(this.selectedYear()));

  readonly cashFlowEvents = computed(() => {
    const month = this.selectedMonth();
    const year = this.selectedYear();
    const projection = this.annualProjection();
    const prevBalance = month > 0 ? projection[month - 1].accumulatedBalance : 0;
    return this.finance.cashFlowEventsForMonth(month, year, prevBalance);
  });

  isActive(expenseId: string, month: number): boolean {
    const expense = this.fixedExpenses().find(e => e.id === expenseId);
    if (!expense) return false;
    return expense.activeMonths.length === 0 || expense.activeMonths.includes(month);
  }

  isIncomeActive(incomeId: string, month: number): boolean {
    const income = this.incomes().find(i => i.id === incomeId);
    if (!income) return false;
    return income.activeMonths.length === 0 || income.activeMonths.includes(month);
  }

  toggleIncome(incomeId: string, month: number): void {
    this.finance.toggleIncomeMonth(incomeId, month);
  }

  toggle(expenseId: string, month: number): void {
    const expense = this.fixedExpenses().find(e => e.id === expenseId);
    if (!expense) return;

    // On first toggle, initialize activeMonths to all months minus the toggled one
    if (expense.activeMonths.length === 0) {
      const allMonths = Array.from({ length: 12 }, (_, i) => i).filter(m => m !== month);
      this.finance.updateExpense(expenseId, { activeMonths: allMonths });
    } else {
      this.finance.toggleExpenseMonth(expenseId, month);
    }
  }
}
