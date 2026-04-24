import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate, getInitials } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, CheckCircle, XCircle } from 'lucide-angular';

interface Inscription {
  id: number;
  membreNom: string;
  membrePrenom: string;
  membreEmail: string;
  offreTitre: string;
  typeOffre: string;
  dateInscription: string;
  statut: string;
}

@Component({
  selector: 'app-bureau-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, ConfirmModalComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, CheckCircle, XCircle }) },
  ],
  templateUrl: './bureau-inscriptions.component.html',
  styleUrl: './bureau-inscriptions.component.scss',
})
export class BureauInscriptionsComponent implements OnInit {
  private http = inject(HttpClient);

  inscriptions  = signal<Inscription[]>([]);
  loading       = signal(true);
  searchQuery   = signal('');
  statutFilter  = signal('all');

  confirmTarget = signal<{ ins: Inscription; action: 'valider' | 'refuser' } | null>(null);
  actionLoading = signal(false);

  readonly statuts = [
    { key: 'all',         label: 'Tous les statuts' },
    { key: 'EN_ATTENTE',  label: 'En attente' },
    { key: 'CONFIRMEE',   label: 'Confirmée' },
    { key: 'REFUSEE',     label: 'Refusée' },
    { key: 'ANNULEE',     label: 'Annulée' },
  ];

  filtered = computed(() => {
    let list = this.inscriptions();
    const q  = this.searchQuery().toLowerCase().trim();
    const s  = this.statutFilter();
    if (s !== 'all') list = list.filter(i => i.statut === s);
    if (q)           list = list.filter(i =>
      `${i.membrePrenom} ${i.membreNom}`.toLowerCase().includes(q) ||
      i.offreTitre.toLowerCase().includes(q)
    );
    return list;
  });

  pendingCount = computed(() => this.inscriptions().filter(i => i.statut === 'EN_ATTENTE').length);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<Inscription[]>('/api/inscriptions').subscribe({
      next:  list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openAction(ins: Inscription, action: 'valider' | 'refuser'): void {
    this.confirmTarget.set({ ins, action });
  }

  cancelAction(): void { this.confirmTarget.set(null); }

  confirmAction(): void {
    const target = this.confirmTarget();
    if (!target) return;
    this.actionLoading.set(true);
    const endpoint = target.action === 'valider'
      ? `/api/inscriptions/${target.ins.id}/confirmer`
      : `/api/inscriptions/${target.ins.id}/refuser`;
    this.http.put(endpoint, {}).subscribe({
      next: () => { this.confirmTarget.set(null); this.actionLoading.set(false); this.load(); },
      error: () => this.actionLoading.set(false),
    });
  }

  formatDate(s: string): string { return formatDate(s); }
  initials(nom: string, prenom: string): string { return getInitials(prenom + ' ' + nom); }
}
