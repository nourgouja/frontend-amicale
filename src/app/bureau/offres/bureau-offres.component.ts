import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { OfferCardComponent, Offre } from '../../shared/components/offer-card/offer-card.component';
import { getOffreTypeColor } from '../../shared/utils/format.utils';

type CategoryFilter = 'mes-offres' | 'tout' | 'VOYAGE' | 'SEJOUR' | 'ACTIVITE' | 'CONVENTION' | 'archivees';
type StatusFilter   = 'tous' | 'OUVERTE' | 'FERMEE' | 'BROUILLON';

const ALL_CAT_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'tout',       label: 'Toutes' },
  { key: 'VOYAGE',     label: 'Voyages' },
  { key: 'SEJOUR',     label: 'Séjours' },
  { key: 'ACTIVITE',   label: 'Activités' },
  { key: 'CONVENTION', label: 'Conventions' },
  { key: 'archivees',  label: 'Archivées' },
];

@Component({
  selector: 'app-bureau-offres',
  standalone: true,
  imports: [CommonModule, DatePipe, OfferCardComponent],
  templateUrl: './bureau-offres.component.html',
  styleUrl:    './bureau-offres.component.scss',
})
export class BureauOffresComponent implements OnInit {
  private router = inject(Router);
  private http   = inject(HttpClient);

  activeFilter  = signal<CategoryFilter>('tout');
  statusFilter  = signal<StatusFilter>('tous');
  searchTerm    = signal('');
  offres        = signal<Offre[]>([]);
  loading       = signal(true);
  toast         = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showDetail    = signal(false);
  selectedOffre = signal<Offre | null>(null);

  /** Types this bureau member is allowed to manage — empty means no restriction */
  poleTypesOffre = signal<string[]>([]);

  catFilters = computed<{ key: CategoryFilter; label: string }[]>(() => {
    const types = this.poleTypesOffre();
    if (!types.length) return ALL_CAT_FILTERS;
    return [
      { key: 'mes-offres', label: 'Mes offres' },
      { key: 'VOYAGE',     label: 'Voyages' },
      { key: 'SEJOUR',     label: 'Séjours' },
      { key: 'ACTIVITE',   label: 'Activités' },
      { key: 'CONVENTION', label: 'Conventions' },
      { key: 'tout',       label: 'Toutes les offres' },
      { key: 'archivees',  label: 'Archivées' },
    ];
  });

  readonly statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'tous',      label: 'Tous statuts' },
    { key: 'OUVERTE',   label: 'Ouvertes' },
    { key: 'FERMEE',    label: 'Fermées' },
    { key: 'BROUILLON', label: 'Brouillons' },
  ];

  filteredOffres = computed(() => {
    let data = this.offres();
    const types = this.poleTypesOffre();
    const cat   = this.activeFilter();
    const st    = this.statusFilter();
    const q     = this.searchTerm().toLowerCase().trim();

    if (cat === 'mes-offres') {
      data = data.filter(o => types.includes(o.typeOffre) && o.statutOffre !== 'ARCHIVEE');
    } else if (cat === 'archivees') {
      data = data.filter(o => o.statutOffre === 'ARCHIVEE');
    } else if (cat === 'tout') {
      data = data.filter(o => o.statutOffre !== 'ARCHIVEE');
    } else {
      data = data.filter(o => o.typeOffre === cat && o.statutOffre !== 'ARCHIVEE');
    }

    if (st !== 'tous') data = data.filter(o => o.statutOffre === st);
    if (q) data = data.filter(o =>
      o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q)
    );
    return data;
  });

  ngOnInit(): void {
    this.http.get<any>('/api/utilisateurs/profil').subscribe({
      next: p => {
        const types: string[] = p.poleTypesOffre ?? [];
        this.poleTypesOffre.set(types);
        if (types.length > 0) {
          this.activeFilter.set('mes-offres');
        }
      },
    });
    this.loadOffres();
  }

  loadOffres(): void {
    this.loading.set(true);
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next:  res => { this.offres.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  setFilter(f: CategoryFilter): void { this.activeFilter.set(f); }
  setStatus(s: StatusFilter): void   { this.statusFilter.set(s); }
  onSearch(e: Event): void           { this.searchTerm.set((e.target as HTMLInputElement).value); }

  openDetail(offre: Offre): void  { this.selectedOffre.set(offre); this.showDetail.set(true); }
  closeDetail(): void             { this.showDetail.set(false); this.selectedOffre.set(null); }

  imageUrl(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }
  typeColor(t: string): string { return getOffreTypeColor(t); }
  inscrits(o: Offre): number   { return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)); }

  goToCreate(): void               { this.router.navigate(['/bureau/offres/creer']); }
  onModifier(id: number): void     { this.closeDetail(); this.router.navigate(['/bureau/offres', id, 'edit']); }
  goToParticipants(id: number): void { this.closeDetail(); this.router.navigate(['/bureau/offres', id, 'inscriptions']); }

  onArchive(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe({
      next: () => {
        this.showToast('Offre archivée avec succès.', 'success');
        this.activeFilter.set('archivees');
        this.loadOffres();
      },
      error: (err) => this.showToast(
        err?.error?.message ?? 'Impossible d\'archiver cette offre.', 'error'
      ),
    });
  }

  onFermer(id: number): void {
    this.http.patch(`/api/offres/fermer/${id}`, {}).subscribe({
      next: () => { this.showToast('Offre fermée.', 'success'); this.loadOffres(); },
      error: (err) => this.showToast(
        err?.error?.message ?? 'Impossible de fermer cette offre.', 'error'
      ),
    });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
