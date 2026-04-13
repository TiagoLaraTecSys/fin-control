import {
  ApplicationConfig,
  provideZoneChangeDetection,
  LOCALE_ID,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localePtBR from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { FinanceService } from './core/services/finance.service';

registerLocaleData(localePtBR);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const finance = inject(FinanceService);
        return () => finance.init();
      },
      multi: true,
    },
    { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/i18n/', suffix: '.json' } },
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'pt-BR',
        loader: { provide: TranslateLoader, useClass: TranslateHttpLoader },
      })
    ),
  ],
};
