import { Component, signal, inject, computed, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Bell } from 'lucide-angular';

@Component({
  selector: 'app-adherent-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, DatePipe, LowerCasePipe, ProfileCardComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Bell }) },
  ],
  templateUrl: './adherent-layout.component.html',
  styleUrl: './adherent-layout.component.scss',
})
export class AdherentLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  notifService        = inject(NotificationService);

  profileOpen = signal(false);
  notifOpen   = signal(false);

  fullName = computed(() => {
    const u = this.authService.currentUser();
    return `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || (u?.email ?? '');
  });

  roleLabel = computed(() => {
    const role = this.authService.currentUser()?.role ?? '';
    const map: Record<string, string> = {
      ADMIN: 'Admin', MEMBRE_BUREAU: 'Membre Bureau', ADHERENT: 'Adhérent',
    };
    return map[role] ?? role;
  });

  initials = computed(() => {
    const u = this.authService.currentUser();
    return ((u?.prenom?.[0] ?? '') + (u?.nom?.[0] ?? '')).toUpperCase() || (u?.email?.[0]?.toUpperCase() ?? '?');
  });

  ngOnInit(): void { this.notifService.init(); }

  toggleProfile(e: MouseEvent): void { e.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }
  toggleNotif(e: MouseEvent): void   { e.stopPropagation(); this.profileOpen.set(false); this.notifOpen.update(v => !v); }

  @HostListener('document:click')
  closeAll(): void { this.profileOpen.set(false); this.notifOpen.set(false); }
}
