import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';
import { ExpenseCategory } from '../../core/models/finance.models';

import { Expense } from '../../core/models/finance.models';

interface CategoryBreakdown {
  category: ExpenseCategory;
  label: string;
  total: number;
  percent: number;
  expenses: Expense[];
}

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly Math = Math;
  private finance = inject(FinanceService);

  readonly months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  readonly monthOptions = [
    { value: null as number | null, label: 'Todos os meses' },
    { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' },
  ];
  readonly years = Array.from({ length: 2030 - new Date().getFullYear() + 1 }, (_, i) => new Date().getFullYear() + i);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedCategoryMonth = signal<number | null>(new Date().getMonth());

  readonly annualProjection = computed(() => this.finance.annualProjection(this.selectedYear()));
  readonly alerts = computed(() => this.finance.variableAlerts());
  readonly totalIncome = this.finance.totalIncome;

  readonly maxExpenses = computed(() =>
    Math.max(...this.annualProjection().map(s => s.totalExpenses), 1)
  );

  readonly maxAbsAccumulated = computed(() =>
    Math.max(...this.annualProjection().map(s => Math.abs(s.accumulatedBalance)), 1)
  );

  readonly categoryBreakdown = computed((): CategoryBreakdown[] => {
    const month = this.selectedCategoryMonth();
    const year = this.selectedYear();
    let expenses: ReturnType<typeof this.finance.expenses>;
    if (month !== null) {
      expenses = this.finance.expensesForMonth(month, year);
    } else {
      const start = this.finance.startMonth();
      const all: typeof expenses = [];
      for (let m = start; m < 12; m++) {
        all.push(...this.finance.expensesForMonth(m, year));
      }
      expenses = all;
    }
    const totalIncome = this.totalIncome();

    // Deduplicate by id (fixed expenses repeat across months in "all year" view)
    const seenCount = new Map<string, number>();
    for (const e of expenses) {
      seenCount.set(e.id, (seenCount.get(e.id) ?? 0) + 1);
    }
    const unique = Array.from(new Map(expenses.map(e => [e.id, e])).values());

    // Group by category
    const catTotals = new Map<ExpenseCategory, number>();
    const catExpenses = new Map<ExpenseCategory, Expense[]>();
    for (const e of unique) {
      const count = seenCount.get(e.id) ?? 1;
      catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount * count);
      if (!catExpenses.has(e.category)) catExpenses.set(e.category, []);
      catExpenses.get(e.category)!.push(e);
    }

    return Array.from(catTotals.entries())
      .map(([category, total]) => ({
        category,
        label: category,
        total,
        percent: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
        expenses: (catExpenses.get(category) ?? []).sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total);
  });

  readonly expandedCategories = signal<Set<ExpenseCategory>>(new Set());

  toggleCategory(cat: ExpenseCategory): void {
    this.expandedCategories.update(s => {
      const next = new Set(s);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  isCategoryExpanded(cat: ExpenseCategory): boolean {
    return this.expandedCategories().has(cat);
  }

  expenseMonthCount(expenseId: string): number {
    const month = this.selectedCategoryMonth();
    const year = this.selectedYear();
    if (month !== null) return 1;
    const start = this.finance.startMonth();
    let count = 0;
    for (let m = start; m < 12; m++) {
      if (this.finance.expensesForMonth(m, year).some(e => e.id === expenseId)) count++;
    }
    return count;
  }

  categoryColor(category: ExpenseCategory): string {
    const colors: Record<ExpenseCategory, string> = {
      housing: '#5c6bc0', transport: '#42a5f5', food: '#66bb6a',
      health: '#ef5350', education: '#ab47bc', leisure: '#ffa726',
      subscriptions: '#26c6da', other: '#8d6e63',
    };
    return colors[category];
  }

  categoryIcon(category: ExpenseCategory): string {
    const icons: Record<ExpenseCategory, string> = {
      housing: 'home', transport: 'directions_car', food: 'restaurant',
      health: 'favorite', education: 'school', leisure: 'sports_esports',
      subscriptions: 'subscriptions', other: 'category',
    };
    return icons[category] ?? 'category';
  }

  categoryGradient(category: ExpenseCategory): string {
    const gradients: Record<ExpenseCategory, string> = {
      housing:       'linear-gradient(135deg,#6366f1,#818cf8)',
      transport:     'linear-gradient(135deg,#f59e0b,#fbbf24)',
      food:          'linear-gradient(135deg,#10b981,#34d399)',
      health:        'linear-gradient(135deg,#ef4444,#f87171)',
      education:     'linear-gradient(135deg,#3b82f6,#60a5fa)',
      leisure:       'linear-gradient(135deg,#ec4899,#f472b6)',
      subscriptions: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
      other:         'linear-gradient(135deg,#64748b,#94a3b8)',
    };
    return gradients[category] ?? 'linear-gradient(135deg,#64748b,#94a3b8)';
  }

  isAnnualProjectionEmpty(): boolean {
    return this.annualProjection().every(s => s.totalExpenses === 0);
  }
}
