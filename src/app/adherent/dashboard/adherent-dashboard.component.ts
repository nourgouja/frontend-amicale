import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { getDisplayName } from '../../shared/utils/format.utils';

interface Offre {
  id: number; titre: string; description: string; typeOffre: string;
  lieu: string; dateDebut: string; dateFin: string; prixParPersonne: number;
  imageBase64: string | null; imageType: string | null; statutOffre: string;
}

interface MembreBureau {
  id: number; nom: string; prenom: string; poste: string | null; poleNom: string | null;
  photoBase64?: string | null; photoType?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  VOYAGE: 'Voyage', SEJOUR: 'Séjour', ACTIVITE: 'Activité',
  CONVENTION: 'Convention', EVENEMENT: 'Événement',
};

const POSTE_ORDER: Record<string, number> = {
  PRESIDENT: 0, TRESORIER: 1, SECRETAIRE: 2, RESPONSABLE_POLE: 3,
};

@Component({
  selector: 'app-adherent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './adherent-dashboard.component.html',
  styleUrl: './adherent-dashboard.component.scss',
})
export class AdherentDashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  offres       = signal<Offre[]>([]);
  membres      = signal<MembreBureau[]>([]);
  activeFilter = signal('');
  loading      = signal(true);

  displayName = computed(() => {
    const u = this.authService.currentUser();
    const full = `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();
    return full || getDisplayName(u?.email ?? '');
  });

  readonly filters = [
    { value: '', label: 'Tout' },
    { value: 'VOYAGE',    label: 'Voyage' },
    { value: 'SEJOUR',    label: 'Séjour' },
    { value: 'ACTIVITE',  label: 'Activité' },
    { value: 'EVENEMENT', label: 'Événement' },
  ];

  allActivites = computed(() =>
    this.offres().filter(o => o.typeOffre !== 'CONVENTION')
  );

  filteredActivites = computed(() => {
    const type = this.activeFilter();
    const list = this.allActivites();
    return type ? list.filter(o => o.typeOffre === type) : list;
  });

  recentActivites = computed(() => this.filteredActivites().slice(0, 6));

  allConventions = computed(() => this.offres().filter(o => o.typeOffre === 'CONVENTION'));
  conventions    = computed(() => this.allConventions().slice(0, 4));

  sortedMembres = computed(() =>
    [...this.membres()].sort((a, b) =>
      (POSTE_ORDER[a.poste ?? ''] ?? 99) - (POSTE_ORDER[b.poste ?? ''] ?? 99)
    )
  );

  ngOnInit(): void {
    this.http.get<Offre[]>('/api/offres/publiques').pipe(
      catchError(() => this.http.get<Offre[]>('/api/offres'))
    ).subscribe({
      next: list => { this.offres.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
    this.http.get<MembreBureau[]>('/api/utilisateurs/membres-bureau').subscribe({
      next: list => this.membres.set(list),
      error: ()  => {},
    });
  }

  setFilter(value: string): void { this.activeFilter.set(value); }

  coverUrl(o: Offre): string | null {
    return o.imageBase64 && o.imageType ? `data:${o.imageType};base64,${o.imageBase64}` : null;
  }

  memberPhotoUrl(m: MembreBureau): string | null {
    return m.photoBase64 && m.photoType ? `data:${m.photoType};base64,${m.photoBase64}` : null;
  }

  typeLabel(type: string): string { return TYPE_LABELS[type] ?? type; }

  initiales(m: MembreBureau): string {
    return ((m.prenom?.[0] ?? '') + (m.nom?.[0] ?? '')).toUpperCase();
  }

  posteLabel(poste: string | null): string {
    const map: Record<string, string> = {
      PRESIDENT: 'Président', TRESORIER: 'Trésorier',
      SECRETAIRE: 'Secrétaire', RESPONSABLE_POLE: 'Responsable de Pôle',
    };
    return poste ? (map[poste] ?? poste) : '—';
  }
}
