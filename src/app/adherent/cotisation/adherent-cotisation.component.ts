import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDate } from '../../shared/utils/format.utils';

interface Cotisation {
  id: number;
  montant: number;
  dateEcheance: string;
  datePaiement?: string;
  statut: string;
  anneeCotisation: number;
}

interface CotisationHistorique {
  id: number;
  montant: number;
  dateEcheance: string;
  datePaiement?: string;
  statut: string;
  anneeCotisation: number;
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

  cotisation  = signal<Cotisation | null>(null);
  historique  = signal<CotisationHistorique[]>([]);
  loading     = signal(true);

  ngOnInit(): void {
    this.http.get<Cotisation>('/api/cotisations/ma-cotisation').subscribe({
      next:  cot => { this.cotisation.set(cot); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });

    this.http.get<CotisationHistorique[]>('/api/cotisations/mon-historique').subscribe({
      next:  list => this.historique.set(list),
      error: ()   => {},
    });
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }

  statusIcon(statut: string): string {
    if (statut === 'PAYEE')     return '✓';
    if (statut === 'EN_RETARD') return '!';
    return '○';
  }
}
