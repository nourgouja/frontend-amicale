import { Component, computed, inject, signal, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MEMBRE_BUREAU: 'Membre Bureau',
  ADHERENT: 'Adhérent',
};

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
})
export class ProfileCardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();

  language = signal<'EN' | 'FR'>('FR');

  email    = computed(() => this.auth.currentUser()?.email ?? '');
  photoUrl = computed(() => this.auth.photoUrl());

  roleLabel = computed(() => {
    const role = this.auth.currentUser()?.role ?? '';
    return ROLE_LABELS[role] ?? role;
  });

  stopProp(e: MouseEvent) { e.stopPropagation(); }

  setLang(lang: 'EN' | 'FR', e: MouseEvent) {
    e.stopPropagation();
    this.language.set(lang);
  }

  editProfile(): void {
    this.close.emit();
    const role = this.auth.currentUser()?.role;
    if (role === 'ADMIN')         this.router.navigate(['/admin/profil']);
    else if (role === 'MEMBRE_BUREAU') this.router.navigate(['/bureau/profil']);
    else                          this.router.navigate(['/adherent/profil']);
  }

  accountSettings(): void {
    this.close.emit();
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    this.auth.logout();
  }
}
