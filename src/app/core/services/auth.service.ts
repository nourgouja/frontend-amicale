import { Injectable, signal } from '@angular/core';
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

  currentUser = signal<{ email: string; role: string } | null>(
    this.loadUserFromStorage()
  );
  firstLogin = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, motDePasse: string) {
    return this.http
      .post<AuthResponse>(`${this.API}/login`, { email, motDePasse })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          this.currentUser.set({ email: payload.sub ?? '', role: res.role });
          this.firstLogin.set(res.firstLogin);
        })
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.firstLogin.set(false);
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

  private loadUserFromStorage(): { email: string; role: string } | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { email: payload.sub ?? '', role: payload.role ?? '' };
    } catch {
      return null;
    }
  }
}
