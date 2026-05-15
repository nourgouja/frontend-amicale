import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { formatDate, getOffreTypeColor, getOffreTypeLabel } from '../../shared/utils/format.utils';

type View            = 'offres' | 'participants' | 'detail';
type OffreStatut     = 'tout' | 'OUVERTE' | 'BROUILLON' | 'FERMEE';
type InsStatut       = 'tout' | 'EN_ATTENTE' | 'CONFIRMEE' | 'REJETEE' | 'ANNULEE';

interface Offre {
  id: number;
  titre: string;
  typeOffre: string;
  statutOffre: string;
  dateDebut: string;
  dateFin?: string | null;
  lieu?: string | null;
  capaciteMax?: number | null;
  placesRestantes?: number | null;
  prixParPersonne?: number | null;
  imageBase64?: string | null;
  imageType?: string | null;
  description?: string | null;
}

interface Inscription {
  id: number;
  adherentId: number;
  adherentNom: string;
  adherentPrenom: string;
  mailAdherent: string;
  statut: string;
  statutPaiement: string;
  montant?: number | null;
  dateInscription: string;
  nombreAccompagnants: number;
  totalPeople?: number | null;
  guests?: Guest[];
  echeanceId?: number | null;
}

interface Guest {
  nom: string;
  prenom?: string;
  age?: number | null;
  sexe?: string | null;
}

interface Echeance {
  id: number;
  montant: number;
  dateEcheance: string;
  statut: string;
}

interface InscriptionDetail extends Inscription {
  guests?: Guest[];
  echeances?: Echeance[];
  notes?: string | null;
}

@Component({
  selector: 'app-activites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activites.component.html',
  styleUrl: './activites.component.scss',
})
export class ActivitesComponent implements OnInit, OnDestroy {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  // ── View state ──────────────────────────────────────────
  view = signal<View>('offres');

  // ── Part A – Offers ──────────────────────────────────────
  offres        = signal<Offre[]>([]);
  offresLoading = signal(true);
  offreSearch   = signal('');
  offreStatut   = signal<OffreStatut>('tout');

  readonly offreStatuts: { key: OffreStatut; label: string }[] = [
    { key: 'tout',      label: 'Toutes' },
    { key: 'OUVERTE',   label: 'Ouvertes' },
    { key: 'BROUILLON', label: 'Brouillons' },
    { key: 'FERMEE',    label: 'Fermées' },
  ];

  filteredOffres = computed(() => {
    let data = this.offres();
    const s  = this.offreStatut();
    const q  = this.offreSearch().toLowerCase().trim();
    if (s !== 'tout') data = data.filter(o => o.statutOffre === s);
    if (q) data = data.filter(o =>
      o.titre.toLowerCase().includes(q) || (o.lieu ?? '').toLowerCase().includes(q)
    );
    return data;
  });

  // ── Part B – Participants ─────────────────────────────────
  selectedOffre = signal<Offre | null>(null);
  inscriptions  = signal<Inscription[]>([]);
  insLoading    = signal(false);
  insSearch     = signal('');
  insStatut     = signal<InsStatut>('tout');
  actionLoading = signal<number | null>(null);

  readonly insStatuts: { key: InsStatut; label: string }[] = [
    { key: 'tout',       label: 'Tous' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'CONFIRMEE',  label: 'Confirmés' },
    { key: 'REJETEE',    label: 'Rejetés' },
    { key: 'ANNULEE',    label: 'Annulés' },
  ];

  filteredIns = computed(() => {
    let data = this.inscriptions();
    const s  = this.insStatut();
    const q  = this.insSearch().toLowerCase().trim();
    if (s !== 'tout') data = data.filter(i => i.statut === s);
    if (q) data = data.filter(i =>
      `${i.adherentPrenom} ${i.adherentNom}`.toLowerCase().includes(q) ||
      i.mailAdherent.toLowerCase().includes(q)
    );
    return data;
  });

  insCounts = computed(() => {
    const list = this.inscriptions();
    return {
      total:    list.length,
      attente:  list.filter(i => i.statut === 'EN_ATTENTE').length,
      confirmee: list.filter(i => i.statut === 'CONFIRMEE').length,
    };
  });

  inscrits = computed(() => {
    const o = this.selectedOffre();
    return o ? Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)) : 0;
  });

  // ── Part C – Detail modal ────────────────────────────────
  selectedIns   = signal<InscriptionDetail | null>(null);
  detailLoading = signal(false);
  notesInput    = signal('');
  notesSaving   = signal(false);
  payLoading    = signal<number | null>(null);

  // ── Toast ────────────────────────────────────────────────
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    const offreId = this.route.snapshot.queryParamMap.get('offreId');
    this.offresLoading.set(true);
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next: data => {
        this.offres.set(data);
        this.offresLoading.set(false);
        if (offreId) {
          const target = data.find(o => o.id === +offreId);
          if (target) this.openParticipants(target);
        }
      },
      error: () => this.offresLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer)    clearTimeout(this.toastTimer);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }

  // ── Part A actions ───────────────────────────────────────
  loadOffres(): void {
    this.offresLoading.set(true);
    this.http.get<Offre[]>('/api/offres/all').subscribe({
      next:  data => { this.offres.set(data); this.offresLoading.set(false); },
      error: ()   => this.offresLoading.set(false),
    });
  }

  openParticipants(offre: Offre): void {
    this.selectedOffre.set(offre);
    this.insStatut.set('tout');
    this.insSearch.set('');
    this.inscriptions.set([]);
    this.insLoading.set(true);
    this.view.set('participants');
    this.http.get<Inscription[]>(`/api/inscriptions/offre/${offre.id}`).subscribe({
      next:  data => { this.inscriptions.set(data); this.insLoading.set(false); },
      error: ()   => this.insLoading.set(false),
    });
  }

  // ── Part B actions ───────────────────────────────────────
  backToOffres(): void {
    this.view.set('offres');
    this.selectedOffre.set(null);
    this.inscriptions.set([]);
  }

  openDetail(ins: Inscription): void {
    this.selectedIns.set(ins as InscriptionDetail);
    this.notesInput.set('');
    this.detailLoading.set(true);
    this.view.set('detail');
    this.http.get<InscriptionDetail>(`/api/inscriptions/${ins.id}`).subscribe({
      next: d => {
        this.selectedIns.set(d);
        this.notesInput.set(d.notes ?? '');
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  confirmer(id: number): void {
    this.actionLoading.set(id);
    this.http.patch(`/api/inscriptions/confirmer/${id}`, {}).subscribe({
      next: () => {
        this.updateInsStatut(id, 'CONFIRMEE');
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
        this.updateInsStatut(id, 'REJETEE');
        this.actionLoading.set(null);
        this.showToast('Inscription rejetée.', 'success');
      },
      error: () => { this.actionLoading.set(null); this.showToast('Erreur lors du rejet.', 'error'); },
    });
  }

  // ── Part C actions ───────────────────────────────────────
  backToParticipants(): void {
    this.view.set('participants');
    this.selectedIns.set(null);
  }

  payer(echeanceId: number, insId: number): void {
    this.payLoading.set(echeanceId);
    this.http.patch(`/api/echeances/${echeanceId}/payer`, {}).subscribe({
      next: () => {
        this.selectedIns.update(d => d ? {
          ...d,
          echeances: d.echeances?.map(e => e.id === echeanceId ? { ...e, statut: 'PAYEE' } : e),
        } : d);
        this.inscriptions.update(list =>
          list.map(i => i.id === insId ? { ...i, statutPaiement: 'PAYEE' } : i)
        );
        this.payLoading.set(null);
        this.showToast('Paiement enregistré.', 'success');
      },
      error: () => { this.payLoading.set(null); this.showToast('Erreur lors du paiement.', 'error'); },
    });
  }

  saveNotes(): void {
    const ins = this.selectedIns();
    if (!ins) return;
    this.notesSaving.set(true);
    this.http.patch(`/api/inscriptions/${ins.id}/notes`, { notes: this.notesInput() }).subscribe({
      next: () => {
        this.selectedIns.update(d => d ? { ...d, notes: this.notesInput() } : d);
        this.notesSaving.set(false);
        this.showToast('Notes enregistrées.', 'success');
      },
      error: () => { this.notesSaving.set(false); this.showToast('Erreur lors de l\'enregistrement.', 'error'); },
    });
  }

  onOffreSearch(value: string): void {
    this.offreSearch.set(value);
  }

  onInsSearch(value: string): void {
    this.insSearch.set(value);
  }

  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'Homme' : s === 'F' ? 'Femme' : s === 'AUTRE' ? 'Autre' : '—';
  }

  // ── Helpers ──────────────────────────────────────────────
  typeColor(t: string): string { return getOffreTypeColor(t); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  fmtDate(s?: string | null): string { return s ? formatDate(s) : '—'; }

  initials(nom: string, prenom: string): string {
    return `${(prenom?.[0] ?? '')}${(nom?.[0] ?? '')}`.toUpperCase();
  }

  fillPercent(o: Offre): number {
    if (!o.capaciteMax) return 0;
    const ins = Math.max(0, o.capaciteMax - (o.placesRestantes ?? 0));
    return Math.round((ins / o.capaciteMax) * 100);
  }

  inscritsCount(o: Offre): number {
    return Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0));
  }

  offreImage(o: Offre): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  private updateInsStatut(id: number, statut: string): void {
    this.inscriptions.update(list =>
      list.map(i => i.id === id ? { ...i, statut } : i)
    );
    if (this.selectedIns()?.id === id) {
      this.selectedIns.update(d => d ? { ...d, statut } : d);
    }
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ msg, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
