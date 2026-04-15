import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bureau-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './bureau-layout.component.html',
  styleUrl: './bureau-layout.component.scss',
})
export class BureauLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url }
  );

  currentPageLabel = computed(() => {
    const url = this.url();
    if (url.includes('dashboard')) return 'Tableau de bord';
    return 'Dashboard';
  });

  initials = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    const parts = email.split('@')[0].split('.');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : email.slice(0, 2).toUpperCase();
  });

  navItems = [
    {
      label: 'Tableau de bord',
      route: '/bureau/dashboard',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    },
  ];

  logout(): void {
    this.authService.logout();
  }
}
