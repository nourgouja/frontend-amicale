import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, CreditCard } from 'lucide-angular';

interface Cotisation {
  id: number;
  membreNom: string;
  membrePrenom: string;
  membreEmail: string;
  montant: number;
  dateEcheance: string;
  datePaiement?: string;
  statut: string;
  anneeCotisation: number;
}

@Component({
  selector: 'app-bureau-cotisations',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, ConfirmModalComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, CreditCard }) },
  ],
  templateUrl: './bureau-cotisations.component.html',
  styleUrl: './bureau-cotisations.component.scss',
})
export class BureauCotisationsComponent implements OnInit {
  private http = inject(HttpClient);

  cotisations   = signal<Cotisation[]>([]);
  loading       = signal(true);
  searchQuery   = signal('');
  statutFilter  = signal('all');

  payTarget  = signal<Cotisation | null>(null);
  payLoading = signal(false);

  readonly statuts = [
    { key: 'all',       label: 'Tous les statuts' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'PAYEE',     label: 'Payée' },
    { key: 'EN_RETARD', label: 'En retard' },
  ];

  filtered = computed(() => {
    let list = this.cotisations();
    const q  = this.searchQuery().toLowerCase().trim();
    const s  = this.statutFilter();
    if (s !== 'all') list = list.filter(c => c.statut === s);
    if (q)           list = list.filter(c =>
      `${c.membrePrenom} ${c.membreNom}`.toLowerCase().includes(q)
    );
    return list;
  });

  retardCount = computed(() => this.cotisations().filter(c => c.statut === 'EN_RETARD').length);

  totalImpaye = computed(() =>
    this.cotisations()
      .filter(c => c.statut !== 'PAYEE')
      .reduce((sum, c) => sum + c.montant, 0)
  );

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<Cotisation[]>('/api/cotisations').subscribe({
      next:  list => { this.cotisations.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openPay(cot: Cotisation): void  { this.payTarget.set(cot); }
  cancelPay(): void               { this.payTarget.set(null); }

  confirmPay(): void {
    const cot = this.payTarget();
    if (!cot) return;
    this.payLoading.set(true);
    this.http.put(`/api/cotisations/${cot.id}/payer`, {
      datePaiement: new Date().toISOString().slice(0, 10),
    }).subscribe({
      next: () => { this.payTarget.set(null); this.payLoading.set(false); this.load(); },
      error: () => this.payLoading.set(false),
    });
  }

  formatDate(s: string): string { 
  return s ? formatDate(s) : '—'; 
}

initials(nom: string, prenom: string): string { 
  return getInitials(prenom + ' ' + nom); 
}
}
