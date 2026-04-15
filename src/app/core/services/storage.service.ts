import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { FinanceState } from '../models/finance.models';

const LOCAL_KEY = 'financial_control_state';
const API = '/api/data';

const EMPTY: FinanceState = { incomes: [], expenses: [], startMonth: new Date().getMonth() };

@Injectable({ providedIn: 'root' })
export class StorageService {
  private http = inject(HttpClient);

  /** Load from API. If API returns empty and localStorage has data, migrates it. */
  load(): Observable<FinanceState> {
    return this.http.get<FinanceState>(API).pipe(
      map(serverState => {
        const isEmpty =
          serverState.incomes.length === 0 && serverState.expenses.length === 0;

        if (isEmpty) {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) {
            try {
              const local: FinanceState = JSON.parse(raw);
              this.save(local); // persiste no arquivo
              localStorage.removeItem(LOCAL_KEY);
              return local;
            } catch { /* ignore */ }
          }
        }
        return serverState;
      }),
      catchError(() => {
        // API indisponível: usa localStorage como fallback
        const raw = localStorage.getItem(LOCAL_KEY);
        return of(raw ? (JSON.parse(raw) as FinanceState) : { ...EMPTY });
      })
    );
  }

  save(state: FinanceState): void {
    this.http.post(API, state).subscribe({
      error: () => {
        // Fallback: salva em localStorage se API cair
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
      },
    });
  }
}
