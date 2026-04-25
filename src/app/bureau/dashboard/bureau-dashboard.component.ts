import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Offre } from '../../shared/components/offer-card/offer-card.component';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName, getOffreTypeColor, formatDate } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Tag, ClipboardList, DollarSign, CalendarDays } from 'lucide-angular';

interface PendingInscription {
  id: number;
  offreTitre: string;
  mailAdherent: string;
  statut: string;
  dateInscription: string;
}

interface BureauDashboardData {
  mesOffres: { statut: string }[];
  totalInscriptionsEnAttente: number;
  inscriptionsEnAttente: PendingInscription[];
  totalPaiementsEnRetard: number;
}

const TYPE_META = [
  { type: 'VOYAGE',     label: 'Voyage',     color: '#3b82f6' },
  { type: 'SEJOUR',     label: 'Séjour',     color: '#10b981' },
  { type: 'ACTIVITE',   label: 'Activité',   color: '#f59e0b' },
  { type: 'CONVENTION', label: 'Convention', color: '#8b5cf6' },
];

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, KpiCardComponent, StatusBadgeComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Tag, ClipboardList, DollarSign, CalendarDays }) },
  ],
  templateUrl: './bureau-dashboard.component.html',
  styleUrl: './bureau-dashboard.component.scss',
})
export class BureauDashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  loading             = signal(true);
  offresActives       = signal(0);
  inscriptionsPending = signal(0);
  cotisationsImpayees = signal(0);
  pendingList         = signal<PendingInscription[]>([]);
  poleTypesOffre      = signal<string[]>([]);
  fullOffres          = signal<Offre[]>([]);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  recentOffres = computed(() => {
    const all = this.fullOffres().filter(o => o.statutOffre !== 'ARCHIVEE');
    return all.slice(0, 5);
  });

  typeDistribution = computed(() => {
    const all   = this.fullOffres().filter(o => o.statutOffre !== 'ARCHIVEE');
    const total = all.length;
    const items = TYPE_META.map(m => ({
      ...m,
      count: all.filter(o => o.typeOffre === m.type).length,
    })).filter(i => i.count > 0);
    return { total, items };
  });

  donutGradient = computed(() => {
    const { total, items } = this.typeDistribution();
    if (!total) return '#e5e7eb';
    let pct = 0;
    const stops = items.map(item => {
      const share = (item.count / total) * 100;
      const from  = pct;
      pct += share;
      return `${item.color} ${from.toFixed(1)}% ${pct.toFixed(1)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date()).replace(/^\w/, c => c.toUpperCase());

  ngOnInit(): void {
    this.loadData();
    this.http.get<any>('/api/utilisateurs/profil').subscribe({
      next: p => this.poleTypesOffre.set(p.poleTypesOffre ?? []),
    });
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next: res => this.fullOffres.set(res),
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.http.get<BureauDashboardData>('/api/bureau/dashboard').subscribe({
      next: data => {
        this.offresActives.set(data.mesOffres?.filter(o => o.statut === 'OUVERTE').length ?? 0);
        this.inscriptionsPending.set(data.totalInscriptionsEnAttente ?? 0);
        this.pendingList.set((data.inscriptionsEnAttente ?? []).slice(0, 5));
        this.cotisationsImpayees.set(data.totalPaiementsEnRetard ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  valider(id: number): void {
    this.http.patch(`/api/inscriptions/confirmer/${id}`, {}).subscribe(() => this.loadData());
  }

  archiver(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe(() => {
      this.http.get<Offre[]>('/api/offres/all').subscribe({ next: res => this.fullOffres.set(res) });
    });
  }

  getOffreImage(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  typeColor(t: string): string { return getOffreTypeColor(t); }
  formatDate(s: string): string { return formatDate(s); }
  pct(count: number, total: number): number { return total ? Math.round(count / total * 100) : 0; }

  initials(mail: string): string {
    const local = mail?.split('@')[0] ?? '';
    const parts = local.split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
}
