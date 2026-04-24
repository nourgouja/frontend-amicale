import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface AuthResponse {
  accessToken: string;
  role: string;
  firstLogin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly API = '/api/auth';

  currentUser = signal<{ email: string; role: string; prenom: string; nom: string } | null>(
    this.loadUserFromStorage()
  );
  firstLogin = signal(false);
  photoUrl   = signal<string | null>(null);

  setPhoto(dataUrl: string | null): void { this.photoUrl.set(dataUrl); }

  // Computed role signals
  isAdmin    = computed(() => this.currentUser()?.role === 'ADMIN');
  isBureau   = computed(() => this.currentUser()?.role === 'MEMBRE_BUREAU');
  isAdherent = computed(() => this.currentUser()?.role === 'ADHERENT');

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, motDePasse: string) {
    return this.http
      .post<AuthResponse>(`${this.API}/login`, { email, motDePasse })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          this.currentUser.set({
            email:  payload.sub   ?? '',
            role:   res.role,
            prenom: payload.prenom ?? '',
            nom:    payload.nom    ?? '',
          });
          this.firstLogin.set(res.firstLogin);
        })
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.firstLogin.set(false);
    this.photoUrl.set(null);
    this.router.navigate(['/login']);
  }

  clearFirstLogin(): void {
    this.firstLogin.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getDashboardRoute(): string {
    const role = this.currentUser()?.role;
    if (role === 'ADMIN')         return '/admin/dashboard';
    if (role === 'MEMBRE_BUREAU') return '/bureau/dashboard';
    return '/adherent/dashboard';
  }

  private loadUserFromStorage(): { email: string; role: string; prenom: string; nom: string } | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email:  payload.sub    ?? '',
        role:   payload.role   ?? '',
        prenom: payload.prenom ?? '',
        nom:    payload.nom    ?? '',
      };
    } catch {
      return null;
    }
  }
}
