import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Component({
  selector: 'app-chiffres-cles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chiffres-cles.component.html',
  styleUrl: './chiffres-cles.component.scss',
})
export class ChiffresComponent implements OnInit {
  private dashboardService = inject(AdminDashboardService);

  loading = signal(true);
  error = signal('');

  totalUtilisateurs = signal(0);
  totalInscriptions = signal(0);
  confirmees = signal(0);
  enAttente = signal(0);
  annulees = signal(0);
  totalCollecte = signal(0);
  totalAttendu = signal(0);

  activePeriod = signal<'6m' | '3m' | '1m'>('6m');

  setPeriod(p: '6m' | '3m' | '1m') { this.activePeriod.set(p); }

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.totalUtilisateurs.set(res.totalUtilisateurs);
        this.totalInscriptions.set(res.totalInscriptions);
        this.confirmees.set(res.confirmees);
        this.enAttente.set(res.enAttente);
        this.annulees.set(res.annulees);
        this.totalCollecte.set(res.totalCollecte);
        this.totalAttendu.set(res.totalAttendu);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les données.');
        this.loading.set(false);
      },
    });
  }
}
