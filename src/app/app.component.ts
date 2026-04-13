import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private translate = inject(TranslateService);
  private router = inject(Router);

  /** Toggles to force re-animation on every route change */
  pageKey = 0;

  constructor() {
    this.translate.use('pt-BR');
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.pageKey++);
  }

  navItems: NavItem[] = [
    { label: 'NAV.DASHBOARD', icon: 'dashboard', path: '/dashboard' },
    { label: 'NAV.INCOME', icon: 'payments', path: '/income' },
    { label: 'NAV.EXPENSES', icon: 'receipt_long', path: '/expenses' },
    { label: 'NAV.BUDGET', icon: 'calendar_month', path: '/budget' },
    { label: 'NAV.REPORTS', icon: 'bar_chart', path: '/reports' },
  ];
}
