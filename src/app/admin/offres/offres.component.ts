import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { OfferCardComponent, Offre } from '../../shared/components/offer-card/offer-card.component';
import { getOffreTypeColor } from '../../shared/utils/format.utils';

type CategoryFilter = 'tout' | 'VOYAGE' | 'SEJOUR' | 'ACTIVITE' | 'CONVENTION' | 'EVENEMENT';
type StatusFilter   = 'tous' | 'OPEN' | 'CLOSED' | 'DRAFT';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, OfferCardComponent],
  templateUrl: './offres.component.html',
  styleUrl: './offres.component.scss',
})
export class OffresComponent implements OnInit {
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

  readonly catFilters: { key: CategoryFilter; label: string }[] = [
    { key: 'tout',       label: 'Toutes' },
    { key: 'VOYAGE',     label: 'Voyages' },
    { key: 'SEJOUR',     label: 'Séjours' },
    { key: 'ACTIVITE',   label: 'Activités' },
    { key: 'CONVENTION', label: 'Conventions' },
    { key: 'EVENEMENT',  label: 'Événements' },
  ];

  readonly statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'tous',   label: 'Tous statuts' },
    { key: 'OPEN',   label: 'Ouvertes' },
    { key: 'CLOSED', label: 'Fermées' },
    { key: 'DRAFT',  label: 'Brouillons' },
  ];

  openCount = computed(() => this.offres().filter(o => o.statutOffre === 'OPEN').length);

  filteredOffres = computed(() => {
    let data = this.offres();
    const cat = this.activeFilter();
    const st  = this.statusFilter();
    const q   = this.searchTerm().toLowerCase().trim();

    if (st === 'DRAFT') {
      return data.filter(o =>
        (o.statutOffre === 'DRAFT' || o.statutOffre === 'ARCHIVED') &&
        (q ? o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q) : true)
      );
    }

    if (st === 'CLOSED') {
      data = data.filter(o => o.statutOffre === 'CLOSED');
    } else {
      data = data.filter(o => o.statutOffre === 'OPEN');
    }

    if (cat !== 'tout') data = data.filter(o => o.typeOffre === cat);
    if (q) data = data.filter(o =>
      o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q)
    );
    return data;
  });

  ngOnInit(): void { this.loadOffres(); }

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
  resetFilters(): void               { this.activeFilter.set('tout'); this.statusFilter.set('tous'); this.searchTerm.set(''); }

  openDetail(offre: Offre): void  { this.selectedOffre.set(offre); this.showDetail.set(true); }
  closeDetail(): void             { this.showDetail.set(false); this.selectedOffre.set(null); }

  imageUrl(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }
  typeColor(t: string): string { return getOffreTypeColor(t); }
  inscrits(o: Offre): number   { return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)); }

  goToCreate(): void                { this.router.navigate(['/admin/offres/creer']); }
  goToParticipants(id: number): void { this.router.navigate(['/admin/activites'], { queryParams: { offreId: id } }); }
  onModifier(id: number): void      { this.closeDetail(); this.router.navigate(['/admin/offres', id, 'edit']); }

  onPublier(id: number): void {
    this.http.patch(`/api/offres/publier/${id}`, {}).subscribe({
      next: () => { this.showToast('Offre publiée avec succès.', 'success'); this.loadOffres(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Impossible de publier cette offre.', 'error'),
    });
  }

  onArchive(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe({
      next: () => { this.showToast('Offre archivée. Visible dans Brouillons.', 'success'); this.loadOffres(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Impossible d\'archiver cette offre.', 'error'),
    });
  }

  onFermer(id: number): void {
    this.http.patch(`/api/offres/fermer/${id}`, {}).subscribe({
      next: () => { this.showToast('Offre fermée.', 'success'); this.loadOffres(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Impossible de fermer cette offre.', 'error'),
    });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
