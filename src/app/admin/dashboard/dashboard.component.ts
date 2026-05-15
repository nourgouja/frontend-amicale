import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminDashboardResponse, AdminDashboardService } from '../services/admin-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { MiniCalendarComponent, CalendarOffre } from '../../shared/components/mini-calendar/mini-calendar.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Offre } from '../../shared/components/offer-card/offer-card.component';
import { getDisplayName, getOffreTypeLabel, formatDate, getOffreTypeColor } from '../../shared/utils/format.utils';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  Users, ClipboardList, Tag, DollarSign, CheckCircle, Calendar
} from 'lucide-angular';

interface RecentInscription {
  id: number;
  offreTitre: string;
  dateDebutOffre?: string;
  dateFinOffre?: string;
  statut: string;
  dateInscription: string;
  adherentNom?: string;
  adherentPrenom?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, KpiCardComponent, MiniCalendarComponent, StatusBadgeComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Users, ClipboardList, Tag, DollarSign, CheckCircle, Calendar }) },
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private http        = inject(HttpClient);

  data    = signal<AdminDashboardResponse | null>(null);
  loading = signal(true);
  error   = signal('');

  /* ── Full offers (for card images) ── */
  fullOffres = signal<Offre[]>([]);

  /* ── Detail panel ── */
  showDetail    = signal(false);
  detailLoading = signal(false);
  selectedOffre = signal<Offre | null>(null);

  /* ── Recent inscriptions ── */
  recentInscriptions = signal<RecentInscription[]>([]);

  /* ── Monthly chart ── */
  monthlyChart = computed(() => {
    const inscriptions = this.recentInscriptions();
    const now = new Date();
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const count = inscriptions.filter(ins => ins.dateInscription?.startsWith(key)).length;
      months.push({ label, count });
    }
    const max = Math.max(...months.map(m => m.count), 1);
    return months.map(m => ({ ...m, pct: Math.round(m.count / max * 100) }));
  });

  readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date()).replace(/^\w/, c => c.toUpperCase());

  adminDisplayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  totalOffres     = computed(() => this.data()?.offres?.length ?? 0);
  offresOuvertes  = computed(() => this.data()?.offres?.filter(o => o.statut === 'OUVERTE').length ?? 0);
  offresBrouillon = computed(() => this.data()?.offres?.filter(o => o.statut === 'BROUILLON').length ?? 0);
  cotisationTotal = computed(() => {
    const d = this.data();
    return (d?.echeancesPayees ?? 0) + (d?.echeancesEnRetard ?? 0) + (d?.echeancesEnAttente ?? 0);
  });
  recentOffres    = computed(() => (this.data()?.offres ?? []).slice(0, 5));

  inscriptionStats = computed(() => {
    const d = this.data();
    if (!d || !d.totalInscriptions) return { score: 0, breakdown: [] as { label: string; color: string; count: number; pct: number }[] };
    const total = d.totalInscriptions;
    return {
      score: +(d.confirmees / total * 10).toFixed(1),
      breakdown: [
        { label: 'En attente', color: '#f59e0b', count: d.enAttente,  pct: Math.round(d.enAttente  / total * 100) },
        { label: 'Confirmées', color: '#10b981', count: d.confirmees, pct: Math.round(d.confirmees / total * 100) },
        { label: 'Annulées',   color: '#6366f1', count: d.annulees,   pct: Math.round(d.annulees   / total * 100) },
      ],
    };
  });

  offresStats = computed(() => {
    const d = this.data();
    if (!d || !d.offres.length) return { score: 0, breakdown: [] as { label: string; color: string; count: number; pct: number }[] };
    const total     = d.offres.length;
    const ouvertes  = d.offres.filter(o => o.statut === 'OUVERTE').length;
    const brouillon = d.offres.filter(o => o.statut === 'BROUILLON').length;
    const fermees   = d.offres.filter(o => o.statut === 'FERMEE').length;
    const archivees = d.offres.filter(o => o.statut === 'ARCHIVEE').length;
    return {
      score: +(ouvertes / total * 10).toFixed(1),
      breakdown: [
        { label: 'Ouvertes',   color: '#026654', count: ouvertes,  pct: Math.round(ouvertes  / total * 100) },
        { label: 'Brouillons', color: '#9ca3af', count: brouillon, pct: Math.round(brouillon / total * 100) },
        { label: 'Fermées',    color: '#dc2626', count: fermees,   pct: Math.round(fermees   / total * 100) },
        { label: 'Archivées',  color: '#d1d5db', count: archivees, pct: Math.round(archivees / total * 100) },
      ].filter(i => i.count > 0),
    };
  });

  cotisationStats = computed(() => {
    const d = this.data();
    if (!d) return { score: 0, breakdown: [] as { label: string; color: string; count: number; pct: number }[] };
    const total = (d.echeancesPayees ?? 0) + (d.echeancesEnRetard ?? 0) + (d.echeancesEnAttente ?? 0);
    if (!total) return { score: 0, breakdown: [] };
    return {
      score: +(d.echeancesPayees / total * 10).toFixed(1),
      breakdown: [
        { label: 'Payées',     color: '#10b981', count: d.echeancesPayees   ?? 0, pct: Math.round((d.echeancesPayees   ?? 0) / total * 100) },
        { label: 'En attente', color: '#f59e0b', count: d.echeancesEnAttente ?? 0, pct: Math.round((d.echeancesEnAttente ?? 0) / total * 100) },
        { label: 'En retard',  color: '#dc2626', count: d.echeancesEnRetard  ?? 0, pct: Math.round((d.echeancesEnRetard  ?? 0) / total * 100) },
      ],
    };
  });

  calendarOffres = computed<CalendarOffre[]>(() =>
    this.fullOffres()
      .filter(o => o.statutOffre === 'OUVERTE' && o.dateDebut)
      .map(o => ({
        id:        o.id,
        titre:     o.titre,
        typeOffre: o.typeOffre,
        dateDebut: o.dateDebut,
      }))
  );

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next: res => this.fullOffres.set(res),
      error: () => {},
    });
    this.http.get<RecentInscription[]>('/api/inscriptions').subscribe({
      next: res => this.recentInscriptions.set(res),
      error: () => {},
    });
  }

  loadDashboard(): void {
    this.dashboardService.getDashboard().subscribe({
      next:  (res) => { this.data.set(res);  this.loading.set(false); },
      error: ()    => { this.error.set('Impossible de charger le tableau de bord.'); this.loading.set(false); },
    });
  }

  openDetail(id: number): void {
    this.showDetail.set(true);
    this.selectedOffre.set(null);
    this.detailLoading.set(true);
    this.http.get<Offre>(`/api/offres/${id}`).subscribe({
      next:  (offre) => { this.selectedOffre.set(offre); this.detailLoading.set(false); },
      error: ()      => {
        const item = this.recentOffres().find(o => o.id === id);
        if (item) {
          this.selectedOffre.set({
            id: item.id, titre: item.titre,
            typeOffre: 'ACTIVITE', statutOffre: item.statut,
            dateDebut: new Date().toISOString(),
            placesRestantes: item.placesRestantes,
          } as Offre);
        }
        this.detailLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.showDetail.set(false);
    this.selectedOffre.set(null);
  }

  archiver(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe(() => {
      this.closeDetail();
      this.loadDashboard();
    });
  }

  getOffreImage(id: number): string | null {
    const o = this.fullOffres().find(f => f.id === id);
    if (!o?.imageBase64 || !o?.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  getOffreColor(id: number): string {
    const o = this.fullOffres().find(f => f.id === id);
    return getOffreTypeColor(o?.typeOffre ?? 'ACTIVITE');
  }

  fmtDate(d: string | undefined | null): string { return d ? formatDate(d) : '—'; }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  recentFive = computed(() => this.recentInscriptions().slice(0, 4));

  inscrits(offre: Offre): number {
    const cap  = offre.capaciteMax ?? 0;
    const rest = offre.placesRestantes ?? 0;
    return Math.max(0, cap - rest);
  }
}
