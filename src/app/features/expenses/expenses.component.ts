import { Component, inject, signal, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';
import { Expense, ExpenseCategory } from '../../core/models/finance.models';

@Pipe({ name: 'expensesTotal', standalone: true })
export class ExpensesTotalPipe implements PipeTransform {
  transform(expenses: Expense[]): number {
    return expenses.reduce((s, e) => s + e.amount, 0);
  }
}

const CATEGORY_META: Record<ExpenseCategory, { icon: string; gradient: string; bg: string; color: string }> = {
  housing:       { icon: 'home',           gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', bg: '#ede9fe', color: '#4338ca' },
  transport:     { icon: 'directions_car', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', bg: '#fef3c7', color: '#92400e' },
  food:          { icon: 'restaurant',     gradient: 'linear-gradient(135deg,#10b981,#34d399)', bg: '#d1fae5', color: '#065f46' },
  health:        { icon: 'favorite',       gradient: 'linear-gradient(135deg,#ef4444,#f87171)', bg: '#fee2e2', color: '#991b1b' },
  education:     { icon: 'school',         gradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)', bg: '#dbeafe', color: '#1e40af' },
  leisure:       { icon: 'sports_esports', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)', bg: '#fce7f3', color: '#9d174d' },
  subscriptions: { icon: 'subscriptions',  gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', bg: '#ede9fe', color: '#5b21b6' },
  other:         { icon: 'category',       gradient: 'linear-gradient(135deg,#64748b,#94a3b8)', bg: '#f1f5f9', color: '#334155' },
};

@Component({
  selector: 'app-expenses',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    ExpensesTotalPipe,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  private finance = inject(FinanceService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly fixedExpenses = this.finance.fixedExpenses;
  readonly variableExpenses = this.finance.variableExpenses;

  readonly categories: ExpenseCategory[] = [
    'housing', 'transport', 'food', 'health', 'education', 'leisure', 'subscriptions', 'other',
  ];

  editingId = signal<string | null>(null);

  form = this.fb.group({
    label: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['other' as ExpenseCategory, Validators.required],
    isFixed: [true],
    dueDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
  });

  get isFixedValue(): boolean {
    return !!this.form.get('isFixed')?.value;
  }

  submit(): void {
    if (this.form.invalid) return;
    const { label, amount, category, isFixed, dueDay } = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.finance.updateExpense(id, { label: label!, amount: amount!, category: category!, isFixed: isFixed!, dueDay: isFixed ? (dueDay ?? 1) : 1 });
      this.editingId.set(null);
    } else {
      this.finance.addExpense({ label: label!, amount: amount!, category: category!, isFixed: isFixed!, activeMonths: [], dueDay: isFixed ? (dueDay ?? 1) : 1 });
    }
    this.form.reset({ category: 'other', isFixed: true, dueDay: 1 });
  }

  edit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.form.setValue({ label: expense.label, amount: expense.amount, category: expense.category, isFixed: expense.isFixed, dueDay: expense.dueDay ?? 1 });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ category: 'other', isFixed: true, dueDay: 1 });
  }

  remove(id: string): void {
    this.finance.removeExpense(id);
  }

  categoryLabel(value: ExpenseCategory): string {
    return this.translate.instant(`EXPENSES.CATEGORIES.${value}`);
  }

  categoryIcon(value: ExpenseCategory): string     { return CATEGORY_META[value]?.icon     ?? 'category'; }
  categoryGradient(value: ExpenseCategory): string { return CATEGORY_META[value]?.gradient ?? ''; }
  categoryBg(value: ExpenseCategory): string       { return CATEGORY_META[value]?.bg       ?? '#f1f5f9'; }
  categoryColor(value: ExpenseCategory): string    { return CATEGORY_META[value]?.color    ?? '#334155'; }
}
