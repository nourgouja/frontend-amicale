import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Simple in-memory toast signal — components can subscribe to this
import { signal } from '@angular/core';
export const globalError = signal<string>('');

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        globalError.set('Session expirée, veuillez vous reconnecter.');
      } else if (err.status === 403) {
        router.navigate([auth.getDashboardRoute()]);
        globalError.set('Accès refusé.');
      } else if (err.status === 0) {
        globalError.set('Impossible de contacter le serveur.');
      } else if (err.status >= 500) {
        globalError.set('Une erreur serveur est survenue. Réessayez.');
      }
      return throwError(() => err);
    })
  );
};
