import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';

interface Tip {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private finance = inject(FinanceService);

  private today = new Date();
  readonly years = Array.from({ length: 2030 - this.today.getFullYear() + 1 }, (_, i) => this.today.getFullYear() + i);
  readonly monthOptions = [
    { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' },
  ];
  readonly selectedYear = signal(this.today.getFullYear());
  readonly selectedMonth = signal(this.today.getMonth());

  readonly summary = computed(() => this.finance.summaryForMonth(this.selectedMonth(), this.selectedYear()));
  readonly alerts = computed(() => this.finance.variableAlerts());
  readonly hasData = computed(() => this.finance.incomes().length > 0);
  readonly fortnights = computed(() => this.finance.cashFlowForMonth(this.selectedMonth(), this.selectedYear()));

  readonly healthStatus = computed(() => {
    const usage = this.summary().usagePercent;
    if (usage <= 50) return { labelKey: 'DASHBOARD.HEALTH_EXCELLENT', cssClass: 'health-excelente', icon: 'sentiment_very_satisfied' };
    if (usage <= 70) return { labelKey: 'DASHBOARD.HEALTH_GOOD', cssClass: 'health-bom', icon: 'sentiment_satisfied' };
    if (usage <= 90) return { labelKey: 'DASHBOARD.HEALTH_CAUTION', cssClass: 'health-atencao', icon: 'sentiment_neutral' };
    return { labelKey: 'DASHBOARD.HEALTH_CRITICAL', cssClass: 'health-critico', icon: 'sentiment_very_dissatisfied' };
  });

  readonly tips: Tip[] = [
    { icon: 'restaurant', text: 'DASHBOARD.TIPS.COOKING' },
    { icon: 'subscriptions', text: 'DASHBOARD.TIPS.SUBSCRIPTIONS' },
    { icon: 'local_grocery_store', text: 'DASHBOARD.TIPS.GROCERY' },
    { icon: 'bolt', text: 'DASHBOARD.TIPS.ENERGY' },
    { icon: 'directions_car', text: 'DASHBOARD.TIPS.TRANSPORT' },
    { icon: 'savings', text: 'DASHBOARD.TIPS.SAVINGS' },
  ];
}
