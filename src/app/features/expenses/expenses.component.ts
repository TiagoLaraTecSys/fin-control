import { Component, inject, signal, computed, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
    MatDatepickerModule,
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

  readonly monthOptions = [
    { value: null, label: 'Todos os meses' },
    { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' },
  ];
  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 2030 - this.currentYear + 1 }, (_, i) => this.currentYear + i);
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedMonth = signal<number | null>(new Date().getMonth());

  readonly today = new Date();

  readonly filteredVariableExpenses = computed(() => {
    const m = this.selectedMonth();
    const y = this.selectedYear();
    if (m === null) {
      // all months of the selected year
      return this.variableExpenses().filter(e => {
        if (!e.date) return false;
        const origin = new Date(e.date + 'T00:00:00');
        const originIndex = origin.getFullYear() * 12 + origin.getMonth();
        const occurrences = e.occurrences ?? 1;
        // overlaps with year y if any month in [originIndex, originIndex+occ) falls in year y
        const yearStart = y * 12;
        const yearEnd = yearStart + 12;
        return originIndex < yearEnd && originIndex + occurrences > yearStart;
      });
    }
    return this.finance.expensesForMonth(m, y).filter(e => !e.isFixed);
  });

  readonly filteredVariableTotal = computed(() =>
    this.filteredVariableExpenses().reduce((s, e) => s + e.amount, 0)
  );

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
    date: [new Date() as Date | null],
    occurrences: [1, [Validators.required, Validators.min(1), Validators.max(60)]],
  });

  get isFixedValue(): boolean {
    return !!this.form.get('isFixed')?.value;
  }

  private toIso(d: Date | null): string {
    const date = d ?? new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  submit(): void {
    if (this.form.invalid) return;
    const { label, amount, category, isFixed, dueDay, date, occurrences } = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.finance.updateExpense(id, {
        label: label!, amount: amount!, category: category!, isFixed: isFixed!,
        dueDay: isFixed ? (dueDay ?? 1) : 1,
        date: isFixed ? undefined : this.toIso(date),
        occurrences: isFixed ? undefined : (occurrences ?? 1),
      });
      this.editingId.set(null);
    } else {
      this.finance.addExpense({
        label: label!, amount: amount!, category: category!, isFixed: isFixed!, activeMonths: [],
        dueDay: isFixed ? (dueDay ?? 1) : 1,
        date: isFixed ? undefined : this.toIso(date),
        occurrences: isFixed ? undefined : (occurrences ?? 1),
      });
    }
    this.form.reset({ category: 'other', isFixed: true, dueDay: 1, date: new Date(), occurrences: 1 });
  }

  edit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.form.setValue({
      label: expense.label, amount: expense.amount, category: expense.category,
      isFixed: expense.isFixed, dueDay: expense.dueDay ?? 1,
      date: expense.date ? new Date(expense.date + 'T00:00:00') : new Date(),
      occurrences: expense.occurrences ?? 1,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ category: 'other', isFixed: true, dueDay: 1, date: new Date(), occurrences: 1 });
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
