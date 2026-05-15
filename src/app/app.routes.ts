import { Routes } from '@angular/router';
import { authGuard }          from './core/guards/auth.guard';
import { adminGuard }         from './admin/guards/admin.guard';
import { bureauGuard }        from './bureau/guards/bureau.guard';
import { adminOrBureauGuard } from './core/guards/admin-or-bureau.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ── Public ─────────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },

  // ── Authenticated (no role) ────────────────────────────────────────────────
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('./admin/users/users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'offres',
        loadComponent: () => import('./admin/offres/offres.component').then(m => m.OffresComponent),
      },
      {
        path: 'offres/creer',
        canActivate: [adminOrBureauGuard],
        loadComponent: () => import('./admin/creer-offre/creer-offre.component').then(m => m.CreerOffreComponent),
      },
      {
        path: 'offres/:id/edit',
        canActivate: [adminOrBureauGuard],
        loadComponent: () => import('./admin/creer-offre/creer-offre.component').then(m => m.CreerOffreComponent),
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./admin/calendrier/calendrier.component').then(m => m.CalendrierComponent),
      },
      {
        path: 'chiffres-cles',
        loadComponent: () => import('./admin/chiffres-cles/chiffres-cles.component').then(m => m.ChiffresComponent),
      },
      {
        path: 'activites',
        loadComponent: () => import('./admin/activites/activites.component').then(m => m.ActivitesComponent),
      },
      {
        path: 'profil',
        loadComponent: () => import('./shared/components/user-profil/user-profil.component').then(m => m.UserProfilComponent),
      },
    ],
  },

  // ── Bureau ─────────────────────────────────────────────────────────────────
  {
    path: 'bureau',
    canActivate: [bureauGuard],
    loadComponent: () => import('./bureau/layout/bureau-layout.component').then(m => m.BureauLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./bureau/dashboard/bureau-dashboard.component').then(m => m.BureauDashboardComponent),
      },
      {
        path: 'offres',
        loadComponent: () => import('./bureau/offres/bureau-offres.component').then(m => m.BureauOffresComponent),
      },
      {
        path: 'offres/mon-pole',
        loadComponent: () => import('./bureau/offres/mon-pole/bureau-mon-pole.component').then(m => m.BureauMonPoleComponent),
      },
      {
        path: 'offres/creer',
        canActivate: [adminOrBureauGuard],
        loadComponent: () => import('./admin/creer-offre/creer-offre.component').then(m => m.CreerOffreComponent),
      },
      {
        path: 'offres/:id/edit',
        canActivate: [adminOrBureauGuard],
        loadComponent: () => import('./admin/creer-offre/creer-offre.component').then(m => m.CreerOffreComponent),
      },
      {
        path: 'offres/:id/inscriptions',
        loadComponent: () => import('./bureau/offres/offre-inscriptions/offre-inscriptions.component').then(m => m.OffreInscriptionsComponent),
      },
      {
        path: 'inscriptions',
        loadComponent: () => import('./bureau/inscriptions/bureau-inscriptions.component').then(m => m.BureauInscriptionsComponent),
      },
      {
        path: 'cotisations',
        loadComponent: () => import('./bureau/cotisations/bureau-cotisations.component').then(m => m.BureauCotisationsComponent),
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./admin/calendrier/calendrier.component').then(m => m.CalendrierComponent),
      },
      {
        path: 'statistiques',
        loadComponent: () => import('./bureau/statistiques/bureau-statistiques.component').then(m => m.BureauStatistiquesComponent),
      },
      {
        path: 'profil',
        loadComponent: () => import('./shared/components/user-profil/user-profil.component').then(m => m.UserProfilComponent),
      },
    ],
  },

  // ── Adhérent ───────────────────────────────────────────────────────────────
  {
    path: 'adherent',
    canActivate: [authGuard],
    loadComponent: () => import('./adherent/layout/adherent-layout.component').then(m => m.AdherentLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./adherent/dashboard/adherent-dashboard.component').then(m => m.AdherentDashboardComponent),
      },
      {
        path: 'offres',
        loadComponent: () => import('./adherent/offres/adherent-offres.component').then(m => m.AdherentOffresComponent),
      },
      {
        path: 'offres/:id',
        loadComponent: () => import('./adherent/offre-detail/offre-detail.component').then(m => m.OffreDetailComponent),
      },
      {
        path: 'inscriptions',
        loadComponent: () => import('./adherent/inscriptions/adherent-inscriptions.component').then(m => m.AdherentInscriptionsComponent),
      },
      {
        path: 'cotisation',
        loadComponent: () => import('./adherent/cotisation/adherent-cotisation.component').then(m => m.AdherentCotisationComponent),
      },
      {
        path: 'annonces',
        loadComponent: () => import('./adherent/annonces/adherent-annonces.component').then(m => m.AdherentAnnoncesComponent),
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./admin/calendrier/calendrier.component').then(m => m.CalendrierComponent),
      },
      {
        path: 'profil',
        loadComponent: () => import('./adherent/profil/adherent-profil.component').then(m => m.AdherentProfilComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
