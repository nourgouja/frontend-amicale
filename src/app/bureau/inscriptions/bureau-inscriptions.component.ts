import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search } from 'lucide-angular';

interface Guest {
  nom: string;
  prenom?: string;
  age?: number | null;
  sexe?: string | null;
}

interface Echeance {
  id: number;
  numero: number;
  montant: number;
  dateEcheance: string;
  statut: string;
}

interface Inscription {
  id: number;
  adherentId?: number;
  adherentNom: string;
  adherentPrenom: string;
  adherentEmail?: string;
  mailAdherent?: string;
  offreTitre: string;
  offreId: number;
  typeOffre: string;
  dateInscription: string;
  statut: string;
  statutPaiement?: string;
  montant?: number | null;
  periodePaiement?: string | null;
  nombreAccompagnants?: number;
  totalPeople?: number | null;
  echeances?: Echeance[];
  guests?: Guest[];
  notes?: string | null;
}

@Component({
  selector: 'app-bureau-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search }) },
  ],
  templateUrl: './bureau-inscriptions.component.html',
  styleUrl: './bureau-inscriptions.component.scss',
})
export class BureauInscriptionsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  inscriptions   = signal<Inscription[]>([]);
  loading        = signal(true);
  searchQuery    = signal('');
  statutFilter   = signal('all');
  typeFilter     = signal('all');

  // Detail panel
  selectedIns    = signal<Inscription | null>(null);
  detailLoading  = signal(false);
  notesInput     = signal('');
  notesSaving    = signal(false);
  actionLoading  = signal<number | null>(null);
  payLoading     = signal<number | null>(null);

  toast          = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly statuts = [
    { key: 'all',        label: 'Tous les statuts' },
    { key: 'PENDING', label: 'En attente' },
    { key: 'APPROVED',  label: 'Confirmée' },
    { key: 'REJECTED',    label: 'Rejetée' },
    { key: 'CANCELLED',    label: 'Annulée' },
  ];

  readonly types = [
    { key: 'all',        label: 'Tous les types' },
    { key: 'VOYAGE',     label: 'Voyage' },
    { key: 'SEJOUR',     label: 'Séjour' },
    { key: 'ACTIVITE',   label: 'Activité' },
    { key: 'CONVENTION', label: 'Convention' },
  ];

  pendingCount = computed(() => this.inscriptions().filter(i => i.statut === 'PENDING').length);

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (this.toastTimer)     clearTimeout(this.toastTimer);
  }

  load(): void {
    this.loading.set(true);
    let params = new HttpParams();
    const s = this.statutFilter();
    const t = this.typeFilter();
    const q = this.searchQuery().trim();
    if (s !== 'all') params = params.set('statut', s);
    if (t !== 'all') params = params.set('type', t);
    if (q)           params = params.set('search', q);
    this.http.get<Inscription[]>('/api/inscriptions/bureau', { params }).subscribe({
      next:  list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  onStatutChange(v: string): void { this.statutFilter.set(v); this.load(); }
  onTypeChange(v: string): void   { this.typeFilter.set(v);   this.load(); }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(), 300);
  }

  openDetail(ins: Inscription): void {
    this.selectedIns.set(ins);
    this.notesInput.set('');
    this.detailLoading.set(true);
    this.http.get<Inscription>(`/api/inscriptions/${ins.id}`).subscribe({
      next: d => { this.selectedIns.set(d); this.notesInput.set(d.notes ?? ''); this.detailLoading.set(false); },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void { this.selectedIns.set(null); }

  confirmer(id: number): void {
    this.actionLoading.set(id);
    this.http.patch(`/api/inscriptions/confirmer/${id}`, {}).subscribe({
      next: () => {
        this.updateStatut(id, 'APPROVED');
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
        this.updateStatut(id, 'REJECTED');
        this.actionLoading.set(null);
        this.showToast('Inscription rejetée.', 'success');
      },
      error: () => { this.actionLoading.set(null); this.showToast('Erreur lors du rejet.', 'error'); },
    });
  }

  payer(echeanceId: number, insId: number): void {
    this.payLoading.set(echeanceId);
    this.http.patch(`/api/echeances/${echeanceId}/payer`, {}).subscribe({
      next: () => {
        this.selectedIns.update(d => d ? {
          ...d,
          echeances: d.echeances?.map(e => e.id === echeanceId ? { ...e, statut: 'PAID' } : e),
        } : d);
        this.inscriptions.update(list =>
          list.map(i => i.id === insId ? { ...i, statutPaiement: 'PAID' } : i)
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

  paidCount(ins: Inscription): number {
    return ins.echeances?.filter(e => e.statut === 'PAID').length ?? 0;
  }

  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'Homme' : s === 'F' ? 'Femme' : s === 'AUTRE' ? 'Autre' : '—';
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }
  initials(nom: string, prenom: string): string { return getInitials(prenom + ' ' + nom); }

  private updateStatut(id: number, statut: string): void {
    this.inscriptions.update(list => list.map(i => i.id === id ? { ...i, statut } : i));
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
