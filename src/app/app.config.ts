import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
<<<<<<< HEAD
import { provideHttpClient } from '@angular/common/http';

=======
import { authInterceptor } from './core/interceptors/auth.interceptor';
>>>>>>> 2a20088d0fbfc904d7fc6482754e0a535260788f

export const appConfig: ApplicationConfig = {
  providers: [
    

    provideHttpClient(),

    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
