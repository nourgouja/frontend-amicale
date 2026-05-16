import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { InscriptionModalComponent, InscriptionResult } from '../inscription-modal/inscription-modal.component';
import { formatDate } from '../../shared/utils/format.utils';

interface OffreDetail {
  id: number;
  titre: string;
  description?: string;
  typeOffre: string;
  statutOffre: string;
  lieu?: string;
  lienExterne?: string;
  dateDebut?: string;
  dateFin?: string;
  capaciteMax?: number;
  placesRestantes?: number;
  prixParPersonne?: number;
  avantages?: string;
  poleNom?: string;
  imageBase64?: string;
  imageType?: string;
  imagesSupplementaires?: { base64: string; type: string }[];
}

interface InscriptionSummary {
  id: number;
  offreId: number;
  statut: string;
}

@Component({
  selector: 'app-offre-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, StatusBadgeComponent, InscriptionModalComponent],
  templateUrl: './offre-detail.component.html',
  styleUrl: './offre-detail.component.scss',
})
export class OffreDetailComponent implements OnInit {
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  offre             = signal<OffreDetail | null>(null);
  loading           = signal(true);
  inscribed         = signal(false);
  inscriptionId     = signal<number | null>(null);
  inscriptionStatus = signal<string | null>(null);
  inscribedGuests   = signal<InscriptionResult['guests']>([]);
  favorited         = signal(false);
  cancelling        = signal(false);
  cancelErr         = signal<string | null>(null);
  modalOpen         = signal(false);
  activeImageIndex  = signal(0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/adherent/offres']); return; }

    forkJoin({
      offre: this.http.get<OffreDetail>(`/api/offres/${id}`),
      inscriptions: this.http.get<InscriptionSummary[]>('/api/inscriptions/mesinscriptions').pipe(
        catchError(() => of([] as InscriptionSummary[]))
      ),
    }).subscribe({
      next: ({ offre, inscriptions }) => {
        this.offre.set(offre);
        const existing = inscriptions.find(
          i => i.offreId === offre.id && i.statut !== 'CANCELLED' && i.statut !== 'REJECTED'
        );
        this.inscribed.set(!!existing);
        this.inscriptionId.set(existing?.id ?? null);
        this.inscriptionStatus.set(existing?.statut ?? null);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/adherent/offres']); },
    });
  }

  openModal(): void  { this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); }

  onInscribed(res: InscriptionResult): void {
    this.inscribed.set(true);
    this.inscriptionId.set(res.id);
    this.inscriptionStatus.set('PENDING');
    this.inscribedGuests.set(res.guests ?? []);
    this.modalOpen.set(false);
  }

  annuler(): void {
    const id = this.inscriptionId();
    if (!id) return;
    this.cancelling.set(true);
    this.cancelErr.set(null);
    this.http.patch<void>(`/api/inscriptions/annuler/${id}`, {}).subscribe({
      next: () => {
        this.inscribed.set(false);
        this.inscriptionId.set(null);
        this.inscriptionStatus.set(null);
        this.inscribedGuests.set([]);
        this.cancelling.set(false);
      },
      error: err => {
        this.cancelling.set(false);
        const msg = err?.error?.message ?? "L'annulation a échoué. Réessayez.";
        this.cancelErr.set(typeof msg === 'string' ? msg : "L'annulation a échoué. Réessayez.");
      },
    });
  }

  toggleFavorite(): void { this.favorited.update(v => !v); }

  getMapUrl(lieu: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu)}`;
  }

  get allImages(): string[] {
    const o = this.offre();
    if (!o) return [];
    const imgs: string[] = [];
    if (o.imageBase64) imgs.push(`data:${o.imageType ?? 'image/jpeg'};base64,${o.imageBase64}`);
    (o.imagesSupplementaires ?? []).forEach(s => imgs.push(`data:${s.type};base64,${s.base64}`));
    return imgs;
  }

  get imageUrl(): string | null {
    const imgs = this.allImages;
    return imgs[this.activeImageIndex()] ?? null;
  }

  get hasMultipleImages(): boolean { return this.allImages.length > 1; }

  selectImage(index: number): void { this.activeImageIndex.set(index); }

  get isFull(): boolean       { return this.offre()?.placesRestantes === 0; }
  get isConvention(): boolean { return this.offre()?.typeOffre === 'CONVENTION'; }

  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'H' : s === 'F' ? 'F' : s === 'AUTRE' ? 'Autre' : '';
  }

  formatDate(s: string): string { return formatDate(s); }

  parseAvantages(raw?: string): string[] {
    if (!raw?.trim()) return [];
    return raw.split('\n').map(l => l.trim()).filter(Boolean);
  }
}
