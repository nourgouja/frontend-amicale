import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Offre {
  id: number; titre: string; description: string; typeOffre: string;
  lieu: string; dateDebut: string; dateFin: string; prixParPersonne: number;
  imageBase64: string | null; imageType: string | null; statutOffre: string;
}

const TYPE_LABELS: Record<string, string> = {
  VOYAGE: 'Voyage', SEJOUR: 'Séjour', ACTIVITE: 'Activité',
  CONVENTION: 'Convention', EVENEMENT: 'Événement',
};

@Component({
  selector: 'app-adherent-offres',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './adherent-offres.component.html',
  styleUrl: './adherent-offres.component.scss',
})
export class AdherentOffresComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  offres        = signal<Offre[]>([]);
  loading       = signal(true);
  searchQuery   = signal('');
  activeFilter  = signal('');
  activeStatut  = signal('OUVERTE');

  readonly typeFilters = [
    { value: '',           label: 'Tout'       },
    { value: 'VOYAGE',     label: 'Voyage'     },
    { value: 'SEJOUR',     label: 'Séjour'     },
    { value: 'ACTIVITE',   label: 'Activité'   },
    { value: 'CONVENTION', label: 'Convention' },
    { value: 'EVENEMENT',  label: 'Événement'  },
  ];

  readonly statutFilters = [
    { value: 'OUVERTE', label: 'Ouvertes' },
    { value: '',        label: 'Toutes'   },
    { value: 'FERMEE',  label: 'Fermées'  },
  ];

  filtered = computed(() => {
    const type   = this.activeFilter();
    const statut = this.activeStatut();
    const q      = this.searchQuery().toLowerCase().trim();
    return this.offres().filter(o => {
      const matchType   = !type   || o.typeOffre   === type;
      const matchStatut = !statut || o.statutOffre === statut;
      const matchQuery  = !q || o.titre.toLowerCase().includes(q)
                             || (o.lieu ?? '').toLowerCase().includes(q);
      return matchType && matchStatut && matchQuery;
    });
  });

  ngOnInit(): void {
    const q    = this.route.snapshot.queryParamMap.get('q');
    const type = this.route.snapshot.queryParamMap.get('type');
    if (q)    this.searchQuery.set(q);
    if (type) this.activeFilter.set(type);

    this.http.get<Offre[]>('/api/offres/publiques').pipe(
      catchError(() => this.http.get<Offre[]>('/api/offres').pipe(catchError(() => of([]))))
    ).subscribe({
      next:  list => { this.offres.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  resetFilters(): void {
    this.activeFilter.set('');
    this.activeStatut.set('OUVERTE');
    this.searchQuery.set('');
  }

  coverUrl(o: Offre): string | null {
    return o.imageBase64 && o.imageType ? `data:${o.imageType};base64,${o.imageBase64}` : null;
  }

  typeLabel(type: string): string { return TYPE_LABELS[type] ?? type; }
}
