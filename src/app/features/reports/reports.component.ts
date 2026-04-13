import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';
import { ExpenseCategory } from '../../core/models/finance.models';

interface CategoryBreakdown {
  category: ExpenseCategory;
  label: string;
  total: number;
  percent: number;
}

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private finance = inject(FinanceService);

  readonly months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  readonly annualProjection = computed(() => this.finance.annualProjection());
  readonly alerts = computed(() => this.finance.variableAlerts());
  readonly totalIncome = this.finance.totalIncome;

  readonly maxExpenses = computed(() =>
    Math.max(...this.annualProjection().map(s => s.totalExpenses), 1)
  );

  readonly categoryBreakdown = computed((): CategoryBreakdown[] => {
    const expenses = this.finance.expenses();
    const totalIncome = this.totalIncome();
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    const labels: Record<ExpenseCategory, string> = {
      housing: 'Housing', transport: 'Transport', food: 'Food',
      health: 'Health', education: 'Education', leisure: 'Leisure',
      subscriptions: 'Subscriptions', other: 'Other',
    };
    return Array.from(map.entries())
      .map(([category, total]) => ({
        category,
        label: labels[category],
        total,
        percent: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  });

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
}
