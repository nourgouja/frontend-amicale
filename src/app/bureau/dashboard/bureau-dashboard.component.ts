import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MiniCalendarComponent, CalendarOffre } from '../../shared/components/mini-calendar/mini-calendar.component';
import { Offre } from '../../shared/components/offer-card/offer-card.component';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName, getOffreTypeColor, getOffreTypeLabel, formatDate } from '../../shared/utils/format.utils';
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

interface SimpleInscription {
  id: number;
  membreNom: string;
  membrePrenom: string;
  membreEmail: string;
  offreTitre: string;
  typeOffre: string;
  dateInscription: string;
  statut: string;
}

const TYPE_META = [
  { type: 'VOYAGE',     label: 'Voyage',     color: '#3b82f6' },
  { type: 'SEJOUR',     label: 'Séjour',     color: '#10b981' },
  { type: 'ACTIVITE',   label: 'Activité',   color: '#f59e0b' },
  { type: 'CONVENTION', label: 'Convention', color: '#8b5cf6' },
  { type: 'ANNONCE',    label: 'Annonce',    color: '#ec4899' },
];

const INSC_META = [
  { statut: 'EN_ATTENTE', label: 'En Attente', color: '#f59e0b' },
  { statut: 'CONFIRMEE',  label: 'Confirmé',   color: '#10b981' },
  { statut: 'REFUSEE',    label: 'Rejeté',     color: '#ef4444' },
  { statut: 'ANNULEE',    label: 'Annulé',     color: '#6366f1' },
];

@Component({
  selector: 'app-bureau-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, KpiCardComponent, StatusBadgeComponent, MiniCalendarComponent, LucideAngularModule],
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
  allInscriptions     = signal<SimpleInscription[]>([]);

  showDetail    = signal(false);
  selectedOffre = signal<Offre | null>(null);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  recentOffres = computed(() =>
    this.fullOffres().filter(o => o.statutOffre !== 'ARCHIVEE')
  );

  calendarOffres = computed<CalendarOffre[]>(() =>
    this.fullOffres()
      .filter(o => o.statutOffre === 'OUVERTE' && o.dateDebut)
      .map(o => ({ id: o.id, titre: o.titre, typeOffre: o.typeOffre, dateDebut: o.dateDebut }))
  );

  typeDistribution = computed(() => {
    const all   = this.fullOffres().filter(o => o.statutOffre !== 'ARCHIVEE');
    const total = all.length;
    const items = TYPE_META.map(m => ({
      ...m,
      count: all.filter(o => o.typeOffre === m.type).length,
    })).filter(i => i.count > 0);
    return { total, items };
  });

  inscDistribution = computed(() => {
    const all   = this.allInscriptions();
    const total = all.length;
    const items = INSC_META.map(m => ({
      ...m,
      count: all.filter(i => i.statut === m.statut).length,
    }));
    return { total, items };
  });

  inscDonutGradient = computed(() => {
    const { total, items } = this.inscDistribution();
    const active = items.filter(i => i.count > 0);
    if (!total || !active.length) return '#e5e7eb';
    let pct = 0;
    const stops = active.map(item => {
      const share = (item.count / total) * 100;
      const from  = pct;
      pct += share;
      return `${item.color} ${from.toFixed(1)}% ${pct.toFixed(1)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  tauxConfirmation = computed(() => {
    const all   = this.allInscriptions();
    const total = all.length;
    if (!total) return { score: 0, breakdown: INSC_META.map(m => ({ ...m, count: 0, pct: 0 })) };
    const confirmed = all.filter(i => i.statut === 'CONFIRMEE').length;
    return {
      score: +(confirmed / total * 10).toFixed(1),
      breakdown: INSC_META.map(m => {
        const count = all.filter(i => i.statut === m.statut).length;
        return { ...m, count, pct: Math.round(count / total * 100) };
      }),
    };
  });

  tauxOccupation = computed(() => {
    const offres = this.fullOffres().filter(o => o.statutOffre === 'OUVERTE' && (o.capaciteMax ?? 0) > 0);
    if (!offres.length) return { score: 0, breakdown: [] as { label: string; color: string; count: number; pct: number }[] };
    const totalCap = offres.reduce((s, o) => s + (o.capaciteMax ?? 0), 0);
    const totalIns = offres.reduce((s, o) => s + Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)), 0);
    const complets = offres.filter(o => (o.placesRestantes ?? 0) === 0).length;
    const presque  = offres.filter(o => { const r = o.placesRestantes ?? 0; const c = o.capaciteMax ?? 1; return r > 0 && r / c < 0.25; }).length;
    const dispo    = offres.length - complets - presque;
    const n        = offres.length;
    return {
      score: totalCap ? +(totalIns / totalCap * 10).toFixed(1) : 0,
      breakdown: [
        { label: 'Complets',         color: '#026654', count: complets, pct: Math.round(complets / n * 100) },
        { label: 'Presque complets', color: '#f59e0b', count: presque,  pct: Math.round(presque / n  * 100) },
        { label: 'Disponibles',      color: '#10b981', count: dispo,    pct: Math.round(dispo / n    * 100) },
      ],
    };
  });

  typeStats = computed(() => {
    const all   = this.fullOffres().filter(o => o.statutOffre !== 'ARCHIVEE');
    const total = all.length;
    return {
      score: total,
      breakdown: TYPE_META
        .map(m => ({ ...m, count: all.filter(o => o.typeOffre === m.type).length, pct: total ? Math.round(all.filter(o => o.typeOffre === m.type).length / total * 100) : 0 }))
        .filter(i => i.count > 0),
    };
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
    this.http.get<SimpleInscription[]>('/api/inscriptions').subscribe({
      next: res => this.allInscriptions.set(res),
      error: () => {},
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

  openDetail(offre: Offre): void {
    this.selectedOffre.set(offre);
    this.showDetail.set(true);
  }

  closeDetail(): void {
    this.showDetail.set(false);
    this.selectedOffre.set(null);
  }

  archiver(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe(() => {
      this.http.get<Offre[]>('/api/offres/all').subscribe({ next: res => this.fullOffres.set(res) });
      this.closeDetail();
    });
  }

  getOffreImage(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  inscrits(o: Offre): number { return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)); }
  typeColor(t: string): string { return getOffreTypeColor(t); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  formatDate(s: string): string { return formatDate(s); }
  pct(count: number, total: number): number { return total ? Math.round(count / total * 100) : 0; }

  initials(mail: string): string {
    const local = mail?.split('@')[0] ?? '';
    const parts = local.split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
}
