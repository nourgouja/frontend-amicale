import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, CreditCard, ChevronDown, ChevronUp } from 'lucide-angular';

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
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, CreditCard, ChevronDown, ChevronUp }) },
  ],
  templateUrl: './bureau-cotisations.component.html',
  styleUrl: './bureau-cotisations.component.scss',
})
export class BureauCotisationsComponent implements OnInit {
  private http = inject(HttpClient);

  echeances    = signal<Echeance[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  expandedId   = signal<number | null>(null);

  payTarget  = signal<Echeance | null>(null);
  payLoading = signal(false);

  /** Group echeances by inscriptionId, only CONFIRMEE inscriptions */
  groups = computed<InscriptionGroup[]>(() => {
    const map = new Map<number, InscriptionGroup>();
    for (const e of this.echeances()) {
      // Exclude explicitly non-confirmed; pass through if field is absent (backend compat)
      if (e.inscriptionStatut && e.inscriptionStatut !== 'CONFIRMEE') continue;
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
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.groups();
    return this.groups().filter(g =>
      `${g.adherentPrenom} ${g.adherentNom} ${g.offreTitre}`.toLowerCase().includes(q)
    );
  });

  retardCount = computed(() =>
    this.echeances().filter(e => e.statut === 'EN_RETARD' && e.inscriptionStatut === 'CONFIRMEE').length
  );

  totalImpaye = computed(() =>
    this.echeances()
      .filter(e => e.statut !== 'PAYEE' && e.inscriptionStatut === 'CONFIRMEE')
      .reduce((s, e) => s + e.montant, 0)
  );

  totalCollecte = computed(() =>
    this.echeances()
      .filter(e => e.statut === 'PAYEE' && e.inscriptionStatut === 'CONFIRMEE')
      .reduce((s, e) => s + e.montant, 0)
  );

  groupStatut(g: InscriptionGroup): string {
    const all = g.echeances.length;
    const paid = g.echeances.filter(e => e.statut === 'PAYEE').length;
    const late = g.echeances.filter(e => e.statut === 'EN_RETARD').length;
    if (paid === all) return 'PAYEE';
    if (late > 0)     return 'EN_RETARD';
    return 'EN_ATTENTE';
  }

  trancheLabel(g: InscriptionGroup): string {
    const paid = g.echeances.filter(e => e.statut === 'PAYEE').length;
    return `${paid}/${g.echeances.length}`;
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

  periodLabel(key?: string): string {
    return ({ COMPTANT: 'Comptant', MENSUEL: 'Mensuel', TRIMESTRIEL: 'Trimestriel', SEMESTRIEL: 'Semestriel' } as Record<string, string>)[key ?? ''] ?? (key ?? '—');
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }

  initials(nom: string, prenom: string): string { return getInitials(prenom + ' ' + nom); }
}
