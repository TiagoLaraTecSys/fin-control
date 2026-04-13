import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private finance = inject(FinanceService);

  readonly today = new Date();
  readonly currentMonth = this.today.getMonth();
  readonly currentYear = this.today.getFullYear();

  readonly summary = computed(() => this.finance.summaryForMonth(this.currentMonth, this.currentYear));
  readonly alerts = computed(() => this.finance.variableAlerts());
  readonly hasData = computed(() => this.finance.incomes().length > 0);
  readonly fortnights = computed(() => this.finance.cashFlowForMonth(this.currentMonth, this.currentYear));

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
