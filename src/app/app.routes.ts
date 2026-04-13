import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'income',
    loadComponent: () =>
      import('./features/income/income.component').then(m => m.IncomeComponent),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
  },
  {
    path: 'budget',
    loadComponent: () =>
      import('./features/budget/budget.component').then(m => m.BudgetComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(m => m.ReportsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
