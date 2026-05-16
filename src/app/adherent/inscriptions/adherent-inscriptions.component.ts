import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { formatDate } from '../../shared/utils/format.utils';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Search, CircleX } from 'lucide-angular';

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
  offreTitre: string;
  offreId: number;
  typeOffre: string;
  dateInscription: string;
  statut: string;
  statutPaiement?: string;
  montant?: number | null;
  lieuOffre?: string;
  dateDebutOffre?: string;
  totalPeople?: number;
  adherentNom?: string;
  adherentPrenom?: string;
  echeances?: Echeance[];
  guests?: Guest[];
}

@Component({
  selector: 'app-adherent-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, ConfirmModalComponent, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Search, CircleX }) },
  ],
  templateUrl: './adherent-inscriptions.component.html',
  styleUrl: './adherent-inscriptions.component.scss',
})
export class AdherentInscriptionsComponent implements OnInit {
  private http = inject(HttpClient);

  inscriptions = signal<Inscription[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  statutFilter = signal('all');
  cancelTarget = signal<Inscription | null>(null);
  cancelling   = signal(false);
  drawerIns    = signal<Inscription | null>(null);

  readonly statuts = [
    { key: 'all',        label: 'Tous les statuts' },
    { key: 'PENDING', label: 'En attente' },
    { key: 'APPROVED',  label: 'Confirmée' },
    { key: 'CANCELLED',    label: 'Annulée' },
    { key: 'REJECTED',    label: 'Rejetée' },
  ];

  readonly typeColors: Record<string, string> = {
    VOYAGE: '#3b82f6', SEJOUR: '#10b981', ACTIVITE: '#f59e0b', CONVENTION: '#8b5cf6',
  };

  filtered = computed(() => {
    let list = this.inscriptions();
    const q  = this.searchQuery().toLowerCase().trim();
    const s  = this.statutFilter();
    if (s !== 'all') list = list.filter(i => i.statut === s);
    if (q)           list = list.filter(i => i.offreTitre.toLowerCase().includes(q));
    return list;
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.http.get<Inscription[]>('/api/inscriptions/mesinscriptions').subscribe({
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
    this.http.patch(`/api/inscriptions/annuler/${ins.id}`, {}).subscribe({
      next: () => {
        this.inscriptions.update(list =>
          list.map(i => i.id === ins.id ? { ...i, statut: 'CANCELLED' } : i)
        );
        if (this.drawerIns()?.id === ins.id)
          this.drawerIns.update(d => d ? { ...d, statut: 'CANCELLED' } : d);
        this.cancelTarget.set(null);
        this.cancelling.set(false);
      },
      error: () => this.cancelling.set(false),
    });
  }

  openDrawer(ins: Inscription): void { this.drawerIns.set(ins); }
  closeDrawer(): void { this.drawerIns.set(null); }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }
  typeColor(type: string): string { return this.typeColors[type] ?? '#9ca3af'; }
  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'Homme' : s === 'F' ? 'Femme' : s === 'AUTRE' ? 'Autre' : '';
  }
}
