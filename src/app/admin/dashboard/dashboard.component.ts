import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { AdminDashboardResponse, AdminDashboardService } from '../services/admin-dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);

  data = signal<AdminDashboardResponse | null>(null);
  loading = signal(true);
  error = signal('');

  adminDisplayName = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    const local = email.split('@')[0];
    const parts = local.split('.');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  });

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le tableau de bord.');
        this.loading.set(false);
      },
    });
  }
}
