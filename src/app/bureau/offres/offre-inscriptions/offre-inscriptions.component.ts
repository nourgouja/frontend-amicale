import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { getOffreTypeColor, getOffreTypeLabel, formatDate } from '../../../shared/utils/format.utils';

interface Inscription {
  id: number;
  adherentId: number;
  adherentNom: string;
  adherentPrenom: string;
  mailAdherent: string;
  statut: string;
  statutPaiement: string;
  montant: number | null;
  dateInscription: string;
}

interface OffreDetail {
  id: number;
  titre: string;
  typeOffre: string;
  statutOffre: string;
  description?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  prixParPersonne?: number;
  capaciteMax?: number;
  placesRestantes?: number;
  imageBase64?: string;
  imageType?: string;
}

@Component({
  selector: 'app-offre-inscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offre-inscriptions.component.html',
  styleUrl: './offre-inscriptions.component.scss',
})
export class OffreInscriptionsComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  offre         = signal<OffreDetail | null>(null);
  inscriptions  = signal<Inscription[]>([]);
  loading       = signal(true);
  actionLoading = signal<number | null>(null);
  toast         = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  searchTerm    = signal('');
  statutFilter  = signal('tous');

  readonly statutFilters = [
    { key: 'tous',      label: 'Tous' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'CONFIRMEE',  label: 'Confirmées' },
    { key: 'REJETEE',    label: 'Rejetées' },
    { key: 'ANNULEE',    label: 'Annulées' },
  ];

  filtered = computed(() => {
    let data = this.inscriptions();
    const q  = this.searchTerm().toLowerCase().trim();
    const st = this.statutFilter();
    if (st !== 'tous') data = data.filter(i => i.statut === st);
    if (q) data = data.filter(i =>
      `${i.adherentPrenom} ${i.adherentNom}`.toLowerCase().includes(q) ||
      i.mailAdherent.toLowerCase().includes(q)
    );
    return data;
  });

  counts = computed(() => ({
    total:     this.inscriptions().length,
    attente:   this.inscriptions().filter(i => i.statut === 'EN_ATTENTE').length,
    confirmee: this.inscriptions().filter(i => i.statut === 'CONFIRMEE').length,
    rejetee:   this.inscriptions().filter(i => i.statut === 'REJETEE').length,
  }));

  inscrits = computed(() => {
    const o = this.offre();
    return o ? Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)) : 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOffre(id);
    this.loadInscriptions(id);
  }

  private loadOffre(id: number): void {
    this.http.get<OffreDetail>(`/api/offres/${id}`).subscribe({
      next: o => this.offre.set(o),
    });
  }

  private loadInscriptions(id: number): void {
    this.loading.set(true);
    this.http.get<Inscription[]>(`/api/inscriptions/offre/${id}`).subscribe({
      next: data => { this.inscriptions.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  confirmer(id: number): void {
    this.actionLoading.set(id);
    this.http.patch(`/api/inscriptions/confirmer/${id}`, {}).subscribe({
      next: () => {
        this.inscriptions.update(list =>
          list.map(i => i.id === id ? { ...i, statut: 'CONFIRMEE' } : i)
        );
        this.actionLoading.set(null);
        this.showToast('Inscription confirmée.', 'success');
      },
      error: () => { this.actionLoading.set(null); this.showToast('Erreur lors de la confirmation.', 'error'); },
    });
  }

  refuser(id: number): void {
    this.actionLoading.set(id);
    this.http.patch(`/api/inscriptions/refuser/${id}`, {}).subscribe({
      next: () => {
        this.inscriptions.update(list =>
          list.map(i => i.id === id ? { ...i, statut: 'REJETEE' } : i)
        );
        this.actionLoading.set(null);
        this.showToast('Inscription rejetée.', 'success');
      },
      error: () => { this.actionLoading.set(null); this.showToast('Erreur lors du rejet.', 'error'); },
    });
  }

  goBack(): void { this.router.navigate(['/bureau/offres']); }
  onSearch(e: Event): void { this.searchTerm.set((e.target as HTMLInputElement).value); }
  setStatut(s: string): void { this.statutFilter.set(s); }

  typeColor(t: string): string { return getOffreTypeColor(t); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  fmtDate(s?: string): string { return s ? formatDate(s) : '—'; }
  initials(nom: string, prenom: string): string {
    return `${(prenom?.[0] ?? '')}${(nom?.[0] ?? '')}`.toUpperCase();
  }

  imageUrl(o: OffreDetail): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
