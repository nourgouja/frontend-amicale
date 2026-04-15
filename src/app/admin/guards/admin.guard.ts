import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    inject(Router).navigate(['/login']);
    return false;
  }
  const user = auth.currentUser();
  if (user?.role !== 'ADMIN') {
    inject(Router).navigate(['/home']);
    return false;
  }
  return true;
};
