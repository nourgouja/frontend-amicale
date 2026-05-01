import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDate } from '../../shared/utils/format.utils';

interface OffreDetail {
  id: number;
  titre: string;
  description?: string;
  typeOffre: string;
  statutOffre: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  capaciteMax?: number;
  placesRestantes?: number;
  prixParPersonne?: number;
  avantages?: string[];
  poleNom?: string;
  imageBase64?: string;
  imageType?: string;
}

interface InscriptionSummary {
  offreId: number;
  statut: string;
}

@Component({
  selector: 'app-offre-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, StatusBadgeComponent],
  templateUrl: './offre-detail.component.html',
  styleUrl: './offre-detail.component.scss',
})
export class OffreDetailComponent implements OnInit {
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  offre      = signal<OffreDetail | null>(null);
  loading    = signal(true);
  inscribed  = signal(false);
  inscribing  = signal(false);
  inscribeErr = signal<string | null>(null);
  favorited   = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/adherent/offres']); return; }

    forkJoin({
      offre: this.http.get<OffreDetail>(`/api/offres/${id}`),
      // Failure here must not block the page — fall back to empty array
      inscriptions: this.http.get<InscriptionSummary[]>('/api/inscriptions/mesinscriptions').pipe(
        catchError(() => of([] as InscriptionSummary[]))
      ),
    }).subscribe({
      next: ({ offre, inscriptions }) => {
        this.offre.set(offre);
        const alreadyIn = inscriptions.some(
          i => i.offreId === offre.id &&
               i.statut !== 'ANNULEE' &&
               i.statut !== 'REJETEE'
        );
        this.inscribed.set(alreadyIn);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/adherent/offres']);
      },
    });
  }

  inscrire(): void {
    const offre = this.offre();
    if (!offre) return;
    this.inscribing.set(true);
    this.inscribeErr.set(null);
    // offreId is a path variable; adherent identity comes from the JWT token — no body needed
    this.http.post<{ message?: string }>(`/api/inscriptions/inscrire/${offre.id}`, {}).subscribe({
      next:  () => { this.inscribed.set(true); this.inscribing.set(false); },
      error: (err) => {
        this.inscribing.set(false);
        const msg = err?.error?.message ?? err?.error ?? "L'inscription a échoué. Réessayez.";
        this.inscribeErr.set(typeof msg === 'string' ? msg : JSON.stringify(msg));
      },
    });
  }

  toggleFavorite(): void { this.favorited.update(v => !v); }

  getMapUrl(lieu: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu)}`;
  }

  get imageUrl(): string | null {
    const o = this.offre();
    if (!o?.imageBase64) return null;
    return `data:${o.imageType ?? 'image/jpeg'};base64,${o.imageBase64}`;
  }

  get hasMultipleImages(): boolean { return false; }

  get isFull(): boolean {
    return this.offre()?.placesRestantes === 0;
  }

  formatDate(s: string): string { return formatDate(s); }
}
