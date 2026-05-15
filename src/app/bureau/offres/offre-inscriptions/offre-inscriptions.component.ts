import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getOffreTypeColor, getOffreTypeLabel, formatDate } from '../../../shared/utils/format.utils';

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
  adherentId: number;
  adherentNom: string;
  adherentPrenom: string;
  mailAdherent: string;
  statut: string;
  statutPaiement: string;
  montant: number | null;
  nombreAccompagnants?: number;
  totalPeople?: number | null;
  dateInscription: string;
  guests?: Guest[];
  echeances?: Echeance[];
  notes?: string | null;
}

interface OffreDetail {
  id: number;
  titre: string;
  typeOffre: string;
  statutOffre: string;
  description?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  prixParPersonne?: number;
  capaciteMax?: number;
  placesRestantes?: number;
  imageBase64?: string;
  imageType?: string;
}

@Component({
  selector: 'app-offre-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offre-inscriptions.component.html',
  styleUrl: './offre-inscriptions.component.scss',
})
export class OffreInscriptionsComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  offre         = signal<OffreDetail | null>(null);
  inscriptions  = signal<Inscription[]>([]);
  loading       = signal(true);
  actionLoading = signal<number | null>(null);
  payLoading    = signal<number | null>(null);
  toast         = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  searchTerm    = signal('');
  statutFilter  = signal('tous');

  // Detail panel
  selectedIns   = signal<Inscription | null>(null);
  detailLoading = signal(false);
  notesInput    = signal('');
  notesSaving   = signal(false);

  readonly statutFilters = [
    { key: 'tous',       label: 'Tous' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'CONFIRMEE',  label: 'Confirmées' },
    { key: 'REJETEE',    label: 'Rejetées' },
    { key: 'ANNULEE',    label: 'Annulées' },
  ];

  filtered = computed(() => {
    let data = this.inscriptions();
    const q  = this.searchTerm().toLowerCase().trim();
    const st = this.statutFilter();
    if (st !== 'tous') data = data.filter(i => i.statut === st);
    if (q) data = data.filter(i =>
      `${i.adherentPrenom} ${i.adherentNom}`.toLowerCase().includes(q) ||
      i.mailAdherent.toLowerCase().includes(q)
    );
    return data;
  });

  counts = computed(() => ({
    total:     this.inscriptions().length,
    attente:   this.inscriptions().filter(i => i.statut === 'EN_ATTENTE').length,
    confirmee: this.inscriptions().filter(i => i.statut === 'CONFIRMEE').length,
    rejetee:   this.inscriptions().filter(i => i.statut === 'REJETEE').length,
  }));

  inscrits = computed(() => {
    const o = this.offre();
    return o ? Math.max(0, (o.capaciteMax ?? 0) - (o.placesRestantes ?? 0)) : 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOffre(id);
    this.loadInscriptions(id);
  }

  private loadOffre(id: number): void {
    this.http.get<OffreDetail>(`/api/offres/${id}`).subscribe({
      next: o => this.offre.set(o),
    });
  }

  private loadInscriptions(id: number): void {
    this.loading.set(true);
    this.http.get<Inscription[]>(`/api/inscriptions/offre/${id}`).subscribe({
      next: data => { this.inscriptions.set(data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openDetail(ins: Inscription, event: MouseEvent): void {
    event.stopPropagation();
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
        this.updateStatut(id, 'CONFIRMEE');
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
        this.updateStatut(id, 'REJETEE');
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
          echeances: d.echeances?.map(e => e.id === echeanceId ? { ...e, statut: 'PAYEE' } : e),
        } : d);
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
      error: () => { this.notesSaving.set(false); this.showToast('Erreur.', 'error'); },
    });
  }

  private updateStatut(id: number, statut: string): void {
    this.inscriptions.update(list => list.map(i => i.id === id ? { ...i, statut } : i));
    if (this.selectedIns()?.id === id) {
      this.selectedIns.update(d => d ? { ...d, statut } : d);
    }
  }

  goBack(): void { this.router.navigate(['/bureau/offres']); }
  onSearch(e: Event): void { this.searchTerm.set((e.target as HTMLInputElement).value); }
  setStatut(s: string): void { this.statutFilter.set(s); }

  exportCsv(): void {
    const offre = this.offre();
    const rows  = this.filtered();
    const sep   = ';';
    const headers = ['Prénom', 'Nom', 'Email', "Date d'inscription", 'Statut', 'Montant (TND)'];
    const lines = rows.map(i => [
      i.adherentPrenom,
      i.adherentNom,
      i.mailAdherent,
      this.fmtDate(i.dateInscription),
      this.statutLabel(i.statut),
      i.montant != null ? String(i.montant) : '',
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(sep));

    const csv  = '﻿' + [headers.join(sep), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `participants_${(offre?.titre ?? 'offre').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPrint(): void {
    const offre = this.offre();
    const rows  = this.filtered();
    const html  = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Participants — ${offre?.titre ?? ''}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        h1   { font-size: 16px; margin-bottom: 4px; }
        p    { color: #666; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
      </style></head><body>
      <h1>Participants — ${offre?.titre ?? ''}</h1>
      <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${rows.length} participant(s)</p>
      <table><thead><tr>
        <th>#</th><th>Participant</th><th>Email</th><th>Date d'inscription</th><th>Statut</th><th>Montant</th>
      </tr></thead><tbody>
      ${rows.map((i, idx) => `<tr>
        <td>${idx + 1}</td>
        <td>${i.adherentPrenom} ${i.adherentNom}</td>
        <td>${i.mailAdherent}</td>
        <td>${this.fmtDate(i.dateInscription)}</td>
        <td>${this.statutLabel(i.statut)}</td>
        <td>${i.montant != null ? i.montant + ' TND' : '—'}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
      </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  private statutLabel(s: string): string {
    switch (s) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE':  return 'Confirmée';
      case 'REJETEE':    return 'Rejetée';
      case 'ANNULEE':    return 'Annulée';
      default:           return s;
    }
  }

  sexeLabel(s?: string | null): string {
    return s === 'M' ? 'Homme' : s === 'F' ? 'Femme' : s === 'AUTRE' ? 'Autre' : '—';
  }

  typeColor(t: string): string { return getOffreTypeColor(t); }
  typeLabel(t: string): string { return getOffreTypeLabel(t); }
  fmtDate(s?: string): string { return s ? formatDate(s) : '—'; }
  initials(nom: string, prenom: string): string {
    return `${(prenom?.[0] ?? '')}${(nom?.[0] ?? '')}`.toUpperCase();
  }

  imageUrl(o: OffreDetail): string | null {
    if (!o.imageBase64 || !o.imageType) return null;
    return `data:${o.imageType};base64,${o.imageBase64}`;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
