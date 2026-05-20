import { Component, computed, inject, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProfileCardComponent, DatePipe, LowerCasePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  authService  = inject(AuthService);
  notifService = inject(NotificationService);

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

  profileOpen = signal(false);
  notifOpen   = signal(false);

  ngOnInit(): void {
    this.notifService.init();
  }

  toggleProfile(event: MouseEvent): void { event.stopPropagation(); this.notifOpen.set(false); this.profileOpen.update(v => !v); }
  toggleNotif(event: MouseEvent): void   { event.stopPropagation(); this.profileOpen.set(false); this.notifOpen.update(v => !v); }

  @HostListener('document:click')
  closeDropdowns(): void { this.profileOpen.set(false); this.notifOpen.set(false); }

  logout(): void { this.authService.logout(); }
}
