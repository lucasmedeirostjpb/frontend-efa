import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { Auth } from './core/services/auth';

function initializeKeycloak(auth: Auth) {
  console.log('APP_INITIALIZER: initializeKeycloak starting...');
  return () => auth.init().then(res => {
    console.log('APP_INITIALIZER: initializeKeycloak finished with:', res);
    return res;
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({ 
        theme: {
            preset: Aura
        }
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [Auth],
      multi: true,
    },
  ],
};
