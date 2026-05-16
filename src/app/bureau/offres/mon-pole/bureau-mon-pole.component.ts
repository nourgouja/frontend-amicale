import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Offre } from '../../../shared/components/offer-card/offer-card.component';
import { getOffreTypeColor, getOffreTypeLabel } from '../../../shared/utils/format.utils';

type StatusFilter = 'tous' | 'OPEN' | 'CLOSED' | 'DRAFT';

@Component({
  selector: 'app-bureau-mon-pole',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bureau-mon-pole.component.html',
  styleUrl: './bureau-mon-pole.component.scss',
})
export class BureauMonPoleComponent implements OnInit {
  private router = inject(Router);
  private http   = inject(HttpClient);

  offres        = signal<Offre[]>([]);
  loading       = signal(true);
  poleTypes     = signal<string[]>([]);
  poleName      = signal('Mon Pôle');
  statusFilter  = signal<StatusFilter>('tous');
  searchTerm    = signal('');
  toast         = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  readonly statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'tous',      label: 'Tous statuts' },
    { key: 'OPEN',   label: 'Ouvertes' },
    { key: 'CLOSED',    label: 'Fermées' },
    { key: 'DRAFT', label: 'Brouillons' },
  ];

  filteredOffres = computed(() => {
    const types = this.poleTypes();
    let data = types.length
      ? this.offres().filter(o => types.includes(o.typeOffre))
      : this.offres();

    data = data.filter(o => o.statutOffre !== 'ARCHIVED' && o.statutOffre !== 'CANCELLED');

    const st = this.statusFilter();
    if (st !== 'tous') data = data.filter(o => o.statutOffre === st);

    const q = this.searchTerm().toLowerCase().trim();
    if (q) data = data.filter(o =>
      o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q)
    );
    return data;
  });

  ngOnInit(): void {
    this.http.get<any>('/api/utilisateurs/profil').subscribe({
      next: p => {
        this.poleTypes.set(p.poleTypesOffre ?? []);
        if (p.poleNom) this.poleName.set(p.poleNom);
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

  onSearch(e: Event): void { this.searchTerm.set((e.target as HTMLInputElement).value); }
  setStatus(v: string): void { this.statusFilter.set(v as StatusFilter); }

  imageUrl(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }
  typeColor(t: string): string { return getOffreTypeColor(t); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  inscrits(o: Offre): number   { return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)); }

  goToCreate(): void                 { this.router.navigate(['/bureau/offres/creer']); }
  onModifier(id: number): void       { this.router.navigate(['/bureau/offres', id, 'edit']); }
  goToParticipants(id: number): void { this.router.navigate(['/bureau/offres', id, 'inscriptions']); }

  onArchive(id: number): void {
    this.http.patch(`/api/offres/archiver/${id}`, {}).subscribe({
      next: () => { this.showToast('Offre archivée.', 'success'); this.loadOffres(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Impossible d\'archiver cette offre.', 'error'),
    });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
