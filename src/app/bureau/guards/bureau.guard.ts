import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const bureauGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    inject(Router).navigate(['/login']);
    return false;
  }
  const role = auth.currentUser()?.role;
  if (role !== 'MEMBRE_BUREAU') {
    inject(Router).navigate(['/home']);
    return false;
  }
  return true;
};
