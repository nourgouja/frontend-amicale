import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, CreditCard, ChevronDown, ChevronUp, Wallet, ClipboardClock, ChartBar, User, RotateCcw, CircleCheck, Download } from 'lucide-angular';

interface Echeance {
  id: number;
  inscriptionId: number;
  numero: number;
  montant: number;
  dateEcheance: string;
  datePaiement?: string;
  statut: string;
  daysUntilDue: number;
  overdue: boolean;
  adherentNom?: string;
  adherentPrenom?: string;
  adherentEmail?: string;
  offreTitre?: string;
  periodePaiement?: string;
  inscriptionStatut?: string;
}

interface InscriptionGroup {
  inscriptionId: number;
  adherentNom: string;
  adherentPrenom: string;
  adherentEmail: string;
  offreTitre: string;
  periodePaiement: string;
  echeances: Echeance[];
}

@Component({
  selector: 'app-bureau-cotisations',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, ConfirmModalComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, CreditCard, ChevronDown, ChevronUp, Wallet, ClipboardClock, ChartBar, User, RotateCcw, CircleCheck, Download }) },
  ],
  templateUrl: './bureau-cotisations.component.html',
  styleUrl: './bureau-cotisations.component.scss',
})
export class BureauCotisationsComponent implements OnInit {
  private http = inject(HttpClient);

  echeances    = signal<Echeance[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  offreFilter  = signal('');
  statutFilter = signal('TOUS');
  expandedId   = signal<number | null>(null);

  payTarget  = signal<Echeance | null>(null);
  payLoading = signal(false);

  readonly pageSize = 10;
  currentPage = signal(1);

  constructor() {
    effect(() => {
      this.searchQuery(); this.offreFilter(); this.statutFilter();
      this.currentPage.set(1);
      this.expandedId.set(null);
    }, { allowSignalWrites: true });
  }

  readonly statutChips = [
    { value: 'TOUS',    label: 'Tous' },
    { value: 'PAID',    label: 'Payé' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'OVERDUE', label: 'Retard' },
  ];

  /** Group echeances by inscriptionId, only CONFIRMEE inscriptions */
  groups = computed<InscriptionGroup[]>(() => {
    const map = new Map<number, InscriptionGroup>();
    for (const e of this.echeances()) {
      // Exclude explicitly non-confirmed; pass through if field is absent (backend compat)
      if (e.inscriptionStatut && e.inscriptionStatut !== 'APPROVED') continue;
      if (!map.has(e.inscriptionId)) {
        map.set(e.inscriptionId, {
          inscriptionId: e.inscriptionId,
          adherentNom:   e.adherentNom    ?? '',
          adherentPrenom: e.adherentPrenom ?? '',
          adherentEmail: e.adherentEmail  ?? '',
          offreTitre:    e.offreTitre     ?? '',
          periodePaiement: e.periodePaiement ?? '',
          echeances: [],
        });
      }
      map.get(e.inscriptionId)!.echeances.push(e);
    }
    // sort echeances inside each group
    for (const g of map.values()) {
      g.echeances.sort((a, b) => a.numero - b.numero);
    }
    return Array.from(map.values());
  });

  filtered = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const offre  = this.offreFilter().toLowerCase().trim();
    const statut = this.statutFilter();
    return this.groups().filter(g => {
      if (q && !`${g.adherentPrenom} ${g.adherentNom} ${g.adherentEmail}`.toLowerCase().includes(q)) return false;
      if (offre && !g.offreTitre.toLowerCase().includes(offre)) return false;
      if (statut !== 'TOUS' && this.groupStatut(g) !== statut) return false;
      return true;
    });
  });

  offresList = computed(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const e of this.echeances()) {
      if (e.offreTitre && !seen.has(e.offreTitre)) {
        seen.add(e.offreTitre);
        list.push(e.offreTitre);
      }
    }
    return list;
  });

  prochaineEcheanceDate = computed(() => {
    const upcoming = this.echeances()
      .filter(e => e.statut === 'PENDING' && e.inscriptionStatut === 'APPROVED')
      .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());
    return upcoming.length > 0 ? upcoming[0].dateEcheance : null;
  });

  membresARelancer = computed(() => {
    return this.groups().filter(g => g.echeances.some(e => e.statut === 'OVERDUE')).length;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pageEnd    = computed(() => Math.min(this.currentPage() * this.pageSize, this.filtered().length));
  pageStart  = computed(() => Math.min((this.currentPage() - 1) * this.pageSize + 1, this.filtered().length));

  paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
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

  goToPage(p: number | '...'): void {
    if (typeof p !== 'number') return;
    this.currentPage.set(p);
    this.expandedId.set(null);
  }

  prevPage(): void { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.expandedId.set(null); } }
  nextPage(): void { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.expandedId.set(null); } }

  retardCount = computed(() =>
    this.echeances().filter(e => e.statut === 'OVERDUE' && e.inscriptionStatut === 'APPROVED').length
  );

  totalImpaye = computed(() =>
    this.echeances()
      .filter(e => e.statut !== 'PAID' && e.inscriptionStatut === 'APPROVED')
      .reduce((s, e) => s + e.montant, 0)
  );

  totalCollecte = computed(() =>
    this.echeances()
      .filter(e => e.statut === 'PAID' && e.inscriptionStatut === 'APPROVED')
      .reduce((s, e) => s + e.montant, 0)
  );

  tauxRecouvrement = computed(() => {
    const total = this.totalCollecte() + this.totalImpaye();
    if (total === 0) return 0;
    return Math.round((this.totalCollecte() / total) * 1000) / 10;
  });

  maxOverdueDays = computed(() => {
    const overdue = this.echeances()
      .filter(e => e.statut === 'OVERDUE' && e.inscriptionStatut === 'APPROVED');
    if (overdue.length === 0) return null;
    return Math.max(...overdue.map(e => Math.abs(e.daysUntilDue ?? 0)));
  });

  groupStatut(g: InscriptionGroup): string {
    const all = g.echeances.length;
    const paid = g.echeances.filter(e => e.statut === 'PAID').length;
    const late = g.echeances.filter(e => e.statut === 'OVERDUE').length;
    if (paid === all) return 'PAID';
    if (late > 0)     return 'OVERDUE';
    return 'PENDING';
  }

  trancheLabel(g: InscriptionGroup): string {
    const paid = g.echeances.filter(e => e.statut === 'PAID').length;
    return `${paid}/${g.echeances.length}`;
  }

  tranchePct(g: InscriptionGroup): number {
    const paid = g.echeances.filter(e => e.statut === 'PAID').length;
    return g.echeances.length > 0 ? Math.round((paid / g.echeances.length) * 100) : 0;
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.offreFilter.set('');
    this.statutFilter.set('TOUS');
  }

  totalGroup(g: InscriptionGroup): number {
    return g.echeances.reduce((s, e) => s + e.montant, 0);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<Echeance[]>('/api/echeances/toutes').subscribe({
      next:  list => { this.echeances.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  toggleExpand(inscriptionId: number): void {
    this.expandedId.update(v => v === inscriptionId ? null : inscriptionId);
  }

  isExpanded(inscriptionId: number): boolean {
    return this.expandedId() === inscriptionId;
  }

  openPay(e: Echeance, event: MouseEvent): void {
    event.stopPropagation();
    this.payTarget.set(e);
  }

  cancelPay(): void { this.payTarget.set(null); }

  confirmPay(): void {
    const e = this.payTarget();
    if (!e) return;
    this.payLoading.set(true);
    this.http.patch(`/api/echeances/${e.id}/payer`, {}).subscribe({
      next: () => { this.payTarget.set(null); this.payLoading.set(false); this.load(); },
      error: () => this.payLoading.set(false),
    });
  }

  exportData(): void {
    const rows: string[][] = [
      ['Membre', 'Email', 'Offre', 'Période', 'Tranche', 'Montant (DT)', 'Échéance', 'Payé le', 'Statut'],
    ];
    for (const g of this.filtered()) {
      for (const ec of g.echeances) {
        rows.push([
          `${g.adherentPrenom} ${g.adherentNom}`,
          g.adherentEmail,
          g.offreTitre,
          this.periodLabel(g.periodePaiement),
          `${ec.numero}/${g.echeances.length}`,
          ec.montant.toString(),
          this.formatDate(ec.dateEcheance),
          this.formatDate(ec.datePaiement ?? ''),
          ec.statut,
        ]);
      }
    }
    const csv = '﻿' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `cotisations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  periodLabel(key?: string): string {
    return ({ COMPTANT: 'Comptant', MENSUEL: 'Mensuel', TRIMESTRIEL: 'Trimestriel', SEMESTRIEL: 'Semestriel' } as Record<string, string>)[key ?? ''] ?? (key ?? '—');
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }

  initials(nom: string, prenom: string): string { return getInitials(prenom + ' ' + nom); }
}
