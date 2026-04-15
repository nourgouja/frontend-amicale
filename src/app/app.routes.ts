import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './admin/guards/admin.guard';
import { bureauGuard } from './bureau/guards/bureau.guard';

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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Activities' },
  },
  {
    path: 'partners',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Partners' },
  },
  {
    path: 'vote',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
    data: { title: 'Vote' },
  },
  {
    path: 'manage-booking',
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },

  /* ─────────── Admin section ─────────── */
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./admin/users/users.component').then((m) => m.AdminUsersComponent),
      },
    ],
  },

  /* ─────────── Bureau section ─────────── */
  {
    path: 'bureau',
    canActivate: [bureauGuard],
    loadComponent: () =>
      import('./bureau/layout/bureau-layout.component').then((m) => m.BureauLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./bureau/dashboard/bureau-dashboard.component').then((m) => m.BureauDashboardComponent),
      },
    ],
  },

  /* ─────────── Adhérent section ─────────── */
  {
    path: 'adherent',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./adherent/dashboard/adherent-dashboard.component').then((m) => m.AdherentDashboardComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
