import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, Download, ClipboardList, Sparkles, Users, CreditCard, ExternalLink, User, RotateCcw } from 'lucide-angular';

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
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, Download, ClipboardList, Sparkles, Users, CreditCard, ExternalLink, User, RotateCcw }) },
  ],
  templateUrl: './bureau-inscriptions.component.html',
  styleUrl: './bureau-inscriptions.component.scss',
})
export class BureauInscriptionsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  inscriptions   = signal<Inscription[]>([]);
  loading        = signal(true);
  searchQuery    = signal('');
  offreQuery     = signal('');
  statutFilter   = signal('all');
  typeFilter     = signal('all');

  filteredInscriptions = computed(() => {
    const q = this.offreQuery().toLowerCase().trim();
    if (!q) return this.inscriptions();
    return this.inscriptions().filter(i => i.offreTitre.toLowerCase().includes(q));
  });

  readonly pageSize = 10;
  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredInscriptions().length / this.pageSize)));
  pageEnd    = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredInscriptions().length));
  pageStart  = computed(() => Math.min((this.currentPage() - 1) * this.pageSize + 1, this.filteredInscriptions().length));

  paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredInscriptions().slice(start, start + this.pageSize);
  });

  pageNumbers = computed((): (number | '...')[] => {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  goToPage(p: number | '...'): void { if (typeof p === 'number') this.currentPage.set(p); }
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

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

  private readonly LAST_LOGIN_KEY = 'bureau_insc_last_login';
  private lastLoginTs = 0;

  pendingCount = computed(() => this.inscriptions().filter(i => i.statut === 'PENDING').length);

  newSinceLastLogin = computed(() =>
    this.inscriptions().filter(i => new Date(i.dateInscription).getTime() > this.lastLoginTs).length
  );

  ngOnInit(): void {
    const stored = localStorage.getItem(this.LAST_LOGIN_KEY);
    this.lastLoginTs = stored ? parseInt(stored, 10) : Date.now() - 86_400_000;
    localStorage.setItem(this.LAST_LOGIN_KEY, Date.now().toString());
    this.load();
  }

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
      next:  list => { this.inscriptions.set(list); this.currentPage.set(1); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  onStatutChange(v: string): void { this.statutFilter.set(v); this.load(); }
  onTypeChange(v: string): void   { this.typeFilter.set(v);   this.load(); }
  setStatut(key: string): void    { this.statutFilter.set(key); this.load(); }
  resetFilters(): void {
    this.searchQuery.set(''); this.offreQuery.set('');
    this.statutFilter.set('all'); this.typeFilter.set('all');
    this.load();
  }

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

  exportData(): void {
    const rows: string[][] = [
      ['Adhérent', 'Email', 'Offre', 'Type', 'Date inscription', 'Statut', 'Période paiement', 'Montant (DT)'],
    ];
    for (const ins of this.inscriptions()) {
      rows.push([
        `${ins.adherentPrenom} ${ins.adherentNom}`,
        ins.adherentEmail ?? ins.mailAdherent ?? '',
        ins.offreTitre,
        ins.typeOffre,
        this.formatDate(ins.dateInscription),
        ins.statut,
        ins.periodePaiement ?? '',
        ins.montant?.toString() ?? '',
      ]);
    }
    const csv  = '﻿' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `inscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
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
