import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { InscriptionModalComponent, InscriptionResult } from '../inscription-modal/inscription-modal.component';
import { formatDate } from '../../shared/utils/format.utils';
import { RouterLink } from '@angular/router';

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
  periodePaiement?: string;
  prixParPersonne?: number | null;
  placesRestantes?: number | null;
  echeances?: Echeance[];
  guests?: Guest[];
}

@Component({
  selector: 'app-adherent-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent, InscriptionModalComponent, RouterLink],
  templateUrl: './adherent-inscriptions.component.html',
  styleUrl: './adherent-inscriptions.component.scss',
})
export class AdherentInscriptionsComponent implements OnInit {
  private http = inject(HttpClient);

  inscriptions = signal<Inscription[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  statutFilter = signal('all');
  cancelTarget  = signal<Inscription | null>(null);
  cancelling    = signal(false);
  selectedIns   = signal<Inscription | null>(null);
  expandedInsId = signal<number | null>(null);
  editTarget    = signal<Inscription | null>(null);
  filterVisible = signal(false);

  readonly statuts = [
    { key: 'all',      label: 'Toutes'     },
    { key: 'APPROVED', label: 'Confirmées' },
    { key: 'PENDING',  label: 'En attente' },
  ];

  readonly typeIconBgs: Record<string, string> = {
    ACTIVITE: '#B3E2C7', SEJOUR: '#E5E7EB', HEBERGEMENT: '#E5E7EB',
    VOYAGE: 'rgba(254,226,226,0.9)', CONVENTION: '#EDE9FE', EVENEMENT: '#DBEAFE',
  };
  readonly typeIconColors: Record<string, string> = {
    ACTIVITE: '#1B5E3B', SEJOUR: '#6B7280', HEBERGEMENT: '#6B7280',
    VOYAGE: '#DC2626', CONVENTION: '#7C3AED', EVENEMENT: '#3B82F6',
  };
  readonly typeBadgeMap: Record<string, { bg: string; color: string }> = {
    ACTIVITE:    { bg: 'rgba(244,196,48,0.20)',  color: '#246B45' },
    SEJOUR:      { bg: 'rgba(59,130,246,0.12)',  color: '#1E40AF' },
    HEBERGEMENT: { bg: 'rgba(59,130,246,0.12)',  color: '#1E40AF' },
    VOYAGE:      { bg: 'rgba(107,114,128,0.15)', color: '#374151' },
    CONVENTION:  { bg: 'rgba(124,58,237,0.12)',  color: '#7C3AED' },
    EVENEMENT:   { bg: 'rgba(59,130,246,0.12)',  color: '#1E40AF' },
  };
  readonly typeLabels: Record<string, string> = {
    VOYAGE: 'Voyage', SEJOUR: 'Séjour', HEBERGEMENT: 'Hébergement',
    ACTIVITE: 'Activité', CONVENTION: 'Convention', EVENEMENT: 'Événement',
  };

  filtered = computed(() => {
    let list = [...this.inscriptions()];
    const q  = this.searchQuery().toLowerCase().trim();
    const s  = this.statutFilter();
    if (s !== 'all') list = list.filter(i => i.statut === s);
    if (q)           list = list.filter(i => i.offreTitre.toLowerCase().includes(q));
    // most recent first
    list.sort((a, b) => (b.dateInscription ?? '').localeCompare(a.dateInscription ?? ''));
    return list;
  });

  totalRestant = computed(() =>
    this.inscriptions()
      .filter(i => i.statut !== 'CANCELLED' && i.statut !== 'REJECTED')
      .flatMap(i => i.echeances ?? [])
      .filter(e => e.statut === 'PENDING' || e.statut === 'OVERDUE')
      .reduce((sum, e) => sum + (e.montant ?? 0), 0)
  );

  montantConfirme = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.inscriptions()
      .filter(i => i.statut === 'APPROVED')
      .filter(i => {
        if (!i.dateDebutOffre) return true;
        if (new Date(i.dateDebutOffre) >= today) return true;
        // past offer: exclude only if fully paid
        const echs = i.echeances ?? [];
        const fullyPaid = echs.length > 0 ? echs.every(e => e.statut === 'PAID') : true;
        return !fullyPaid;
      })
      .reduce((sum, i) => sum + (i.montant ?? 0), 0);
  });

  montantEnAttente = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.inscriptions()
      .filter(i => i.statut === 'PENDING')
      .filter(i => {
        if (!i.dateDebutOffre) return true;
        if (new Date(i.dateDebutOffre) >= today) return true;
        const echs = i.echeances ?? [];
        const fullyPaid = echs.length > 0 ? echs.every(e => e.statut === 'PAID') : true;
        return !fullyPaid;
      })
      .reduce((sum, i) => sum + (i.montant ?? 0), 0);
  });

  montantTotal = computed(() => this.montantConfirme() + this.montantEnAttente());

  prochainesEcheancesCount = computed(() =>
    this.inscriptions()
      .filter(i => i.statut !== 'CANCELLED' && i.statut !== 'REJECTED')
      .flatMap(i => i.echeances ?? [])
      .filter(e => e.statut === 'PENDING' || e.statut === 'OVERDUE')
      .length
  );

  secretaireEmail = signal<string | null>(null);

  ngOnInit(): void { this.load(); this.loadSecretaire(); }

  private load(): void {
    this.loading.set(true);
    this.http.get<Inscription[]>('/api/inscriptions/mesinscriptions').subscribe({
      next: list => { this.inscriptions.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  private loadSecretaire(): void {
    this.http.get<{ id: number; nom: string; prenom: string; poste: string | null; poleNom: string | null; email: string }[]>('/api/utilisateurs/membres-bureau').subscribe({
      next: membres => {
        const sec = membres.find(m => m.poste === 'SECRETARY');
        this.secretaireEmail.set(sec?.email ?? null);
      },
    });
  }

  get mailtoSecretaire(): string {
    const email = this.secretaireEmail();
    if (!email) return 'mailto:';
    const subject = encodeURIComponent('Demande concernant mon inscription – Amicale STAR');
    const body = encodeURIComponent('Bonjour,\n\nJe me permets de vous contacter concernant mon inscription.\n\nCordialement,');
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  selectIns(ins: Inscription | null): void { this.selectedIns.set(ins); }
  toggleExpand(ins: Inscription): void {
    this.expandedInsId.update(id => id === ins.id ? null : ins.id);
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
        if (this.selectedIns()?.id === ins.id)
          this.selectedIns.update(d => d ? { ...d, statut: 'CANCELLED' } : d);
        this.cancelTarget.set(null);
        this.cancelling.set(false);
      },
      error: () => this.cancelling.set(false),
    });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  openEdit(ins: Inscription): void { this.editTarget.set(ins); }
  closeEdit(): void { this.editTarget.set(null); }

  onEditSubmitted(updated: InscriptionResult): void {
    const u = updated as unknown as Inscription;
    this.inscriptions.update(list => list.map(i => i.id === u.id ? { ...i, ...u } : i));
    if (this.selectedIns()?.id === u.id) this.selectedIns.update(d => d ? { ...d, ...u } : d);
    this.editTarget.set(null);
  }

  paidCount(ins: Inscription): number {
    return ins.echeances?.filter(e => e.statut === 'PAID').length ?? 0;
  }

  formatDate(s: string): string { return s ? formatDate(s) : '—'; }
  typeIconBg(type: string): string { return this.typeIconBgs[type] ?? '#F3F4F6'; }
  typeIconColor(type: string): string { return this.typeIconColors[type] ?? '#9CA3AF'; }
  typeBadgeStyle(type: string): { background: string; color: string } {
    const c = this.typeBadgeMap[type];
    return c ? { background: c.bg, color: c.color } : { background: 'rgba(107,114,128,0.15)', color: '#374151' };
  }
  typeLabel(type: string): string { return this.typeLabels[type] ?? type; }
  statutLabel(s: string): string {
    const m: Record<string, string> = { APPROVED: 'Confirmée', PENDING: 'En attente', CANCELLED: 'Annulée', REJECTED: 'Rejetée' };
    return m[s] ?? s;
  }
  statutDotColor(s: string): string {
    const m: Record<string, string> = { APPROVED: '#1B5E3B', PENDING: '#F59E0B', CANCELLED: '#9CA3AF', REJECTED: '#DC2626' };
    return m[s] ?? '#9CA3AF';
  }
  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'Homme' : s === 'F' ? 'Femme' : s === 'AUTRE' ? 'Autre' : '';
  }
}
