import { Component, computed, inject, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { getDisplayName, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, LayoutDashboard, Tag, ClipboardList, DollarSign, CalendarDays } from 'lucide-angular';

@Component({
  selector: 'app-bureau-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, LowerCasePipe, ProfileCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LayoutDashboard, Tag, ClipboardList, DollarSign, CalendarDays }) },
  ],
  templateUrl: './bureau-layout.component.html',
  styleUrl: './bureau-layout.component.scss',
})
export class BureauLayoutComponent implements OnInit {
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

  initials    = computed(() => getInitials(this.authService.currentUser()?.email ?? ''));
  displayName = computed(() => getDisplayName(this.authService.currentUser()?.email ?? ''));

  profileOpen = signal(false);
  notifOpen   = signal(false);

  readonly navItems = [
    { label: 'Tableau de bord', route: '/bureau/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Mes Offres',      route: '/bureau/offres',       icon: 'Tag'             },
    { label: 'Inscriptions',    route: '/bureau/inscriptions', icon: 'ClipboardList'   },
    { label: 'Cotisations',     route: '/bureau/cotisations',  icon: 'DollarSign'      },
    { label: 'Calendrier',      route: '/bureau/calendrier',   icon: 'CalendarDays'    },
    //{ label: 'Statistiques',    route: '/bureau/statistiques', icon: 'BarChart2'       },
  ];

  readonly icons = { LayoutDashboard, Tag, ClipboardList, DollarSign, CalendarDays };

  ngOnInit(): void { this.notifService.init(); }

  toggleProfile(e: MouseEvent): void { e.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }
  toggleNotif(e: MouseEvent): void   { e.stopPropagation(); this.profileOpen.set(false); this.notifOpen.update(v => !v); }

  @HostListener('document:click')
  closeDropdowns(): void { this.profileOpen.set(false); this.notifOpen.set(false); }

  logout(): void { this.authService.logout(); }
}
