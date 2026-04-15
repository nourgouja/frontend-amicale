import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'activities',
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Activities' },
  },
  {
    path: 'partners',
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Partners' },
  },
  {
    path: 'vote',
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Vote' },
  },
  {
    path: 'manage-booking',
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Manage Booking' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },
];
