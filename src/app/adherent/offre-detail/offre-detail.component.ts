import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  nbInscrits: number;
  montantAdhesion?: number;
  avantages?: string[];
  imageBase64?: string;
  imageType?: string;
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

  offre     = signal<OffreDetail | null>(null);
  loading   = signal(true);
  inscribed = signal(false);
  inscribing = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/adherent/offres']); return; }

    this.http.get<OffreDetail>(`/api/offres/${id}`).subscribe({
      next:  o => { this.offre.set(o); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/adherent/offres']); },
    });
  }

  inscrire(): void {
    const offre = this.offre();
    if (!offre) return;
    this.inscribing.set(true);
    this.http.post('/api/inscriptions', { offreId: offre.id }).subscribe({
      next: () => { this.inscribed.set(true); this.inscribing.set(false); },
      error: () => this.inscribing.set(false),
    });
  }

  get imageUrl(): string | null {
    const o = this.offre();
    if (!o?.imageBase64) return null;
    return `data:${o.imageType ?? 'image/jpeg'};base64,${o.imageBase64}`;
  }

  get isFull(): boolean {
    const o = this.offre();
    return !!o?.capaciteMax && o.nbInscrits >= o.capaciteMax;
  }

  formatDate(s: string): string { return formatDate(s); }
}
