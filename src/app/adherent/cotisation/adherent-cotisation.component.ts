import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDate } from '../../shared/utils/format.utils';

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
}

interface InscriptionSummary {
  id: number;
  offreTitre: string;
  statut: string;
  montant: number;
  periodePaiement?: string;
  echeances: Echeance[];
}

@Component({
  selector: 'app-adherent-cotisation',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './adherent-cotisation.component.html',
  styleUrl: './adherent-cotisation.component.scss',
})
export class AdherentCotisationComponent implements OnInit {
  private http = inject(HttpClient);

  inscriptions = signal<InscriptionSummary[]>([]);
  loading      = signal(true);

  // Only CONFIRMEE inscriptions with echeances
  confirmed = computed(() =>
    this.inscriptions().filter(i => i.statut === 'CONFIRMEE' && i.echeances?.length > 0)
  );

  allEcheances = computed(() => this.confirmed().flatMap(i => i.echeances));

  prochaines = computed(() =>
    this.allEcheances()
      .filter(e => e.statut !== 'PAYEE')
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance))
      .slice(0, 5)
  );

  totalPaye = computed(() =>
    this.allEcheances().filter(e => e.statut === 'PAYEE').reduce((s, e) => s + e.montant, 0)
  );

  totalImpaye = computed(() =>
    this.allEcheances().filter(e => e.statut !== 'PAYEE').reduce((s, e) => s + e.montant, 0)
  );

  ngOnInit(): void {
    this.http.get<InscriptionSummary[]>('/api/inscriptions/mesinscriptions').subscribe({
      next:  list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }

  statusIcon(statut: string): string {
    if (statut === 'PAYEE')     return '✓';
    if (statut === 'EN_RETARD') return '!';
    return '○';
  }
}
