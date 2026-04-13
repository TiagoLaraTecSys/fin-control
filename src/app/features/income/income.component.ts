import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
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
    MatTableModule,
    MatDividerModule,
    TranslateModule,
  ],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss',
})
export class IncomeComponent {
  private finance = inject(FinanceService);
  private fb = inject(FormBuilder);

  readonly incomes = this.finance.incomes;
  readonly totalIncome = this.finance.totalIncome;
  readonly displayedColumns = ['label', 'amount', 'receiptDay', 'actions'];

  editingId = signal<string | null>(null);

  form = this.fb.group({
    label: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    receiptDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { label, amount, receiptDay } = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.finance.updateIncome(id, { label: label!, amount: amount!, receiptDay: receiptDay! });
      this.editingId.set(null);
    } else {
      this.finance.addIncome({ label: label!, amount: amount!, receiptDay: receiptDay! });
    }
    this.form.reset({ receiptDay: 1 });
  }

  edit(income: Income): void {
    this.editingId.set(income.id);
    this.form.setValue({ label: income.label, amount: income.amount, receiptDay: income.receiptDay ?? 1 });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ receiptDay: 1 });
  }

  remove(id: string): void {
    this.finance.removeIncome(id);
  }
}
