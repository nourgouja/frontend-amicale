import { Component, signal, inject, computed, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName, getInitials } from '../../shared/utils/format.utils';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, LayoutDashboard, Tag, ClipboardList, CreditCard, User, Bell } from 'lucide-angular';

@Component({
  selector: 'app-adherent-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ProfileCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LayoutDashboard, Tag, ClipboardList, CreditCard, User, Bell }) },
  ],
  templateUrl: './adherent-layout.component.html',
  styleUrl: './adherent-layout.component.scss',
})
export class AdherentLayoutComponent {
  private authService = inject(AuthService);

  profileOpen = signal(false);
  notifOpen   = signal(false);

  displayName = computed(() => getDisplayName(this.authService.currentUser()?.email ?? ''));
  initials    = computed(() => getInitials(this.authService.currentUser()?.email ?? ''));

  readonly navItems = [
    { route: '/adherent/dashboard',    label: 'Tableau de bord', icon: 'layout-dashboard' },
    { route: '/adherent/offres',       label: 'Offres',           icon: 'tag' },
    { route: '/adherent/inscriptions', label: 'Mes inscriptions', icon: 'clipboard-list' },
    { route: '/adherent/cotisation',   label: 'Ma cotisation',    icon: 'credit-card' },
    { route: '/adherent/profil',       label: 'Mon profil',       icon: 'user' },
  ];

  toggleProfile(e: MouseEvent): void { e.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }
  toggleNotif(e: MouseEvent): void   { e.stopPropagation(); this.profileOpen.set(false); this.notifOpen.update(v => !v); }

  @HostListener('document:click')
  closeAll(): void { this.profileOpen.set(false); this.notifOpen.set(false); }
}
