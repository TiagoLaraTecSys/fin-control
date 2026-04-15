import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { FinanceService } from '../../core/services/finance.service';
import { Income } from '../../core/models/finance.models';

@Component({
  selector: 'app-income',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss',
})
export class IncomeComponent {
  private finance = inject(FinanceService);
  private fb = inject(FormBuilder);

  readonly fixedIncomes = this.finance.fixedIncomes;
  readonly variableIncomes = this.finance.variableIncomes;
  readonly totalIncome = this.finance.totalIncome;

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

  readonly filteredVariableIncomes = computed(() => {
    const m = this.selectedMonth();
    const y = this.selectedYear();
    if (m === null) {
      return this.variableIncomes().filter(i => {
        if (!i.date) return false;
        return new Date(i.date + 'T00:00:00').getFullYear() === y;
      });
    }
    return this.finance.incomesForMonth(m, y).filter(i => !i.isFixed);
  });

  editingId = signal<string | null>(null);

  form = this.fb.group({
    label: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    isFixed: [true],
    receiptDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    date: [new Date() as Date | null],
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
    const { label, amount, isFixed, receiptDay, date } = this.form.getRawValue();
    const id = this.editingId();
    const base = {
      label: label!, amount: amount!, isFixed: isFixed!,
      receiptDay: isFixed ? (receiptDay ?? 1) : 1,
      date: isFixed ? undefined : this.toIso(date),
      activeMonths: [] as number[],
    };
    if (id) {
      this.finance.updateIncome(id, base);
      this.editingId.set(null);
    } else {
      this.finance.addIncome(base);
    }
    this.form.reset({ isFixed: true, receiptDay: 1, date: new Date() });
  }

  edit(income: Income): void {
    this.editingId.set(income.id);
    this.form.setValue({
      label: income.label, amount: income.amount,
      isFixed: income.isFixed, receiptDay: income.receiptDay ?? 1,
      date: income.date ? new Date(income.date + 'T00:00:00') : new Date(),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ isFixed: true, receiptDay: 1, date: new Date() });
  }

  remove(id: string): void {
    this.finance.removeIncome(id);
  }
}
