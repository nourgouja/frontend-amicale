import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminDashboardResponse, AdminDashboardService } from '../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  data = signal<AdminDashboardResponse | null>(null);
  loading = signal(true);
  error = signal('');

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
