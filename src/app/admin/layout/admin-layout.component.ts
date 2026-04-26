import { Component, computed, inject, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, LayoutDashboard, TrendingUp, Users, Activity, Tag, CalendarDays } from 'lucide-angular';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur', MEMBRE_BUREAU: 'Membre Bureau', ADHERENT: 'Adhérent',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProfileCardComponent, LucideAngularModule, DatePipe, LowerCasePipe],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LayoutDashboard, TrendingUp, Users, Activity, Tag, CalendarDays }) },
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  authService  = inject(AuthService);
  notifService = inject(NotificationService);
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
    if (url.includes('dashboard'))     return 'Tableau de bord';
    if (url.includes('chiffres-cles')) return 'Chiffres Clés';
    if (url.includes('utilisateurs'))  return 'Utilisateurs';
    if (url.includes('activites'))     return 'Activités';
    if (url.includes('offres'))        return 'Offres';
    if (url.includes('calendrier'))    return 'Calendrier';
    return 'Dashboard';
  });

  initials = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    const parts = email.split('@')[0].split('.');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : email.slice(0, 2).toUpperCase();
  });

  adminDisplayName = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    const local = email.split('@')[0];
    const parts = local.split('.');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  });

  roleLabel = computed(() => {
    const role = this.authService.currentUser()?.role ?? '';
    return ROLE_LABELS[role] ?? role;
  });

  userRole = computed(() => this.authService.currentUser()?.role ?? '');

  readonly icons = { LayoutDashboard, TrendingUp, Users, Activity, Tag, CalendarDays };

  ngOnInit(): void {
    this.notifService.init();
  }

  navItems = [
    { label: 'Dashboard',     route: '/admin/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Chiffres Clés', route: '/admin/chiffres-cles',icon: 'TrendingUp'      },
    { label: 'Utilisateurs',  route: '/admin/utilisateurs', icon: 'Users'           },
    { label: 'Activités',     route: '/admin/activites',    icon: 'Activity'        },
    { label: 'Offres',        route: '/admin/offres',       icon: 'Tag'             },
    { label: 'Calendrier',    route: '/admin/calendrier',   icon: 'CalendarDays'    },
  ];

  profileOpen = signal(false);
  notifOpen   = signal(false);
  language    = signal<'FR' | 'EN'>('FR');

  toggleProfile(event: MouseEvent): void { event.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }

  toggleNotif(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notifOpen.update(v => !v);
  }

  clearNotifs(event: MouseEvent): void {
    event.stopPropagation();
    this.notifService.markAllRead();
  }

  navigateNotif(link: string | null): void {
    this.notifOpen.set(false);
    if (link) this.router.navigateByUrl(link);
  }

  setLanguage(lang: 'FR' | 'EN', event: MouseEvent): void { event.stopPropagation(); this.language.set(lang); }

  goToChangePassword(): void { this.profileOpen.set(false); this.router.navigate(['/change-password']); }

  @HostListener('document:click')
  closeDropdowns(): void { this.profileOpen.set(false); this.notifOpen.set(false); }

  logout(): void { this.authService.logout(); }
}
