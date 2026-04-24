import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, XCircle } from 'lucide-angular';

interface Inscription {
  id: number;
  offreTitre: string;
  typeOffre: string;
  dateInscription: string;
  statut: string;
  lieuOffre?: string;
  dateDebutOffre?: string;
}

@Component({
  selector: 'app-adherent-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, ConfirmModalComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, XCircle }) },
  ],
  templateUrl: './adherent-inscriptions.component.html',
  styleUrl: './adherent-inscriptions.component.scss',
})
export class AdherentInscriptionsComponent implements OnInit {
  private http = inject(HttpClient);

  inscriptions  = signal<Inscription[]>([]);
  loading       = signal(true);
  searchQuery   = signal('');
  statutFilter  = signal('all');
  cancelTarget  = signal<Inscription | null>(null);
  cancelling    = signal(false);

  readonly statuts = [
    { key: 'all',        label: 'Tous les statuts' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'CONFIRMEE',  label: 'Confirmée' },
    { key: 'REFUSEE',    label: 'Refusée' },
    { key: 'ANNULEE',    label: 'Annulée' },
  ];

  readonly typeColors: Record<string, string> = {
    SPORTIF: '#3b82f6', CULTUREL: '#8b5cf6', EDUCATIF: '#f59e0b', LOISIRS: '#10b981',
  };

  filtered = computed(() => {
    let list = this.inscriptions();
    const q  = this.searchQuery().toLowerCase().trim();
    const s  = this.statutFilter();
    if (s !== 'all') list = list.filter(i => i.statut === s);
    if (q)           list = list.filter(i => i.offreTitre.toLowerCase().includes(q));
    return list;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.http.get<Inscription[]>('/api/inscriptions/mes-inscriptions').subscribe({
      next:  list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCancel(ins: Inscription): void { this.cancelTarget.set(ins); }
  closeCancel(): void { this.cancelTarget.set(null); }

  confirmCancel(): void {
    const ins = this.cancelTarget();
    if (!ins) return;
    this.cancelling.set(true);
    this.http.put(`/api/inscriptions/${ins.id}/annuler`, {}).subscribe({
      next: () => { this.cancelTarget.set(null); this.cancelling.set(false); this.ngOnInit(); },
      error: () => this.cancelling.set(false),
    });
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }
  typeColor(type: string): string { return this.typeColors[type] ?? '#ccc'; }
}
