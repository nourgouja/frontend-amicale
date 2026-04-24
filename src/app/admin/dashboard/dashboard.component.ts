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
  recentOffres    = computed(() => (this.data()?.offres ?? []).slice(0, 5));

  calendarOffres = computed<CalendarOffre[]>(() =>
    (this.data()?.offres ?? []).map(o => ({
      id:        o.id,
      titre:     o.titre,
      typeOffre: 'ACTIVITE',
      dateDebut: new Date().toISOString(),
    }))
  );

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next: res => this.fullOffres.set(res),
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

  fmtDate(d: string): string { return formatDate(d); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }

  inscrits(offre: Offre): number {
    const cap  = offre.capaciteMax ?? 0;
    const rest = offre.placesRestantes ?? 0;
    return Math.max(0, cap - rest);
  }
}
