import { Component, signal, inject, computed, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive, Router } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
<<<<<<< HEAD
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, LayoutDashboard, ClipboardList, Megaphone, CreditCard, CalendarDays, Bell, ChartPie, Award } from 'lucide-angular';
=======
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, LayoutDashboard, LayoutGrid, ClipboardList, Megaphone, CreditCard, CalendarDays, Bell } from 'lucide-angular';
>>>>>>> 3d95afcba61c50d6157d516348402465974a98c4

@Component({
  selector: 'app-adherent-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, LowerCasePipe, ProfileCardComponent, LucideAngularModule],
  providers: [
<<<<<<< HEAD
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LayoutDashboard, ClipboardList, Megaphone, CreditCard, CalendarDays, Bell, ChartPie, Award }) },
=======
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LayoutDashboard, LayoutGrid, ClipboardList, Megaphone, CreditCard, CalendarDays, Bell }) },
>>>>>>> 3d95afcba61c50d6157d516348402465974a98c4
  ],
  templateUrl: './adherent-layout.component.html',
  styleUrl: './adherent-layout.component.scss',
})
export class AdherentLayoutComponent implements OnInit {
  authService  = inject(AuthService);
  private router = inject(Router);
  notifService   = inject(NotificationService);

  profileOpen = signal(false);
  notifOpen   = signal(false);

  readonly navItems = [
    { label: 'Home',             route: '/adherent/dashboard',    icon: 'LayoutDashboard' },
    { label: 'Catalogue',        route: '/adherent/offres',       icon: 'LayoutGrid'      },
    { label: 'Mes Inscriptions', route: '/adherent/inscriptions', icon: 'ClipboardList'   },
<<<<<<< HEAD
    { label: 'Sondages',         route: '/adherent/sondages',     icon: 'ChartPie'        },
=======
    { label: 'Mes Paiements',    route: '/adherent/cotisation',   icon: 'CreditCard'      },
>>>>>>> 3d95afcba61c50d6157d516348402465974a98c4
    { label: 'Annonces',         route: '/adherent/annonces',     icon: 'Megaphone'       },
    { label: 'Calendrier',       route: '/adherent/calendrier',   icon: 'CalendarDays'    },
    { label: 'Élections',        route: '/adherent/elections',    icon: 'Award'           },
  ];

  displayName = computed(() => {
    const u = this.authService.currentUser();
    return `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || (u?.email ?? '');
  });

  initials = computed(() => {
    const u = this.authService.currentUser();
    return ((u?.prenom?.[0] ?? '') + (u?.nom?.[0] ?? '')).toUpperCase() || (u?.email?.[0]?.toUpperCase() ?? '?');
  });

  ngOnInit(): void { this.notifService.init(); }

  toggleProfile(e: MouseEvent): void { e.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }
  toggleNotif(e: MouseEvent): void   { e.stopPropagation(); this.profileOpen.set(false); this.notifOpen.update(v => !v); }

  onSearch(query: string): void {
    if (query.trim()) {
      this.router.navigate(['/adherent/offres'], { queryParams: { q: query.trim() } });
    }
  }

  @HostListener('document:click')
  closeAll(): void { this.profileOpen.set(false); this.notifOpen.set(false); }
}
