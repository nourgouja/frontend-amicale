import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AdminDashboardService } from '../services/admin-dashboard.service';

interface InscriptionDate { dateInscription: string; }

@Component({
  selector: 'app-chiffres-cles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chiffres-cles.component.html',
  styleUrl: './chiffres-cles.component.scss',
})
export class ChiffresComponent implements OnInit {
  private dashboardService = inject(AdminDashboardService);
  private http = inject(HttpClient);

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
  inscriptions = signal<InscriptionDate[]>([]);

  readonly CIRCUM = 2 * Math.PI * 50; // ≈ 314.16 for r=50

  monthlyChart = computed(() => {
    const list = this.inscriptions();
    const period = this.activePeriod();
    const now = new Date();
    const numMonths = period === '6m' ? 6 : period === '3m' ? 3 : 1;
    const buckets: { label: string; count: number }[] = [];

    if (period === '1m') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i + 1) * 7);
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const count = list.filter(ins => {
          const d = new Date(ins.dateInscription);
          return d >= start && d < end;
        }).length;
        buckets.push({ label: `S${4 - i}`, count });
      }
    } else {
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'short' });
        const count = list.filter(ins => ins.dateInscription?.startsWith(key)).length;
        buckets.push({ label, count });
      }
    }
    const max = Math.max(...buckets.map(b => b.count), 1);
    return buckets.map(b => ({ ...b, pct: Math.round(b.count / max * 100) }));
  });

  donutSegments = computed(() => {
    const total = this.totalInscriptions();
    if (!total) return [];
    const c = this.CIRCUM;
    const items = [
      { color: '#026654', count: this.confirmees(), label: 'Confirmées' },
      { color: '#f59e0b', count: this.enAttente(),  label: 'En attente' },
      { color: '#dc2626', count: this.annulees(),   label: 'Annulées' },
    ];
    let accumulated = 0;
    return items.map(item => {
      const dash = (item.count / total) * c;
      // Start at 12 o'clock: offset = c/4 − accumulated
      const offset = c / 4 - accumulated;
      accumulated += dash;
      return { ...item, dash, gap: c - dash, offset };
    });
  });

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
    this.http.get<InscriptionDate[]>('/api/inscriptions').subscribe({
      next: res => this.inscriptions.set(res),
      error: () => {},
    });
  }
}
