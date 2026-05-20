import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SondageService } from '../../core/services/sondage.service';
import { Sondage } from '../../core/models/sondage.model';

@Component({
  selector: 'app-bureau-sondages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bureau-sondages.component.html',
  styleUrl: './bureau-sondages.component.scss',
})
export class BureauSondagesComponent implements OnInit {
  private router         = inject(Router);
  private sondageService = inject(SondageService);
  private http           = inject(HttpClient);

  sondages        = signal<Sondage[]>([]);
  loading         = signal(true);
  toast           = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showDetail      = signal(false);
  selectedSondage = signal<Sondage | null>(null);
  totalMembres    = signal(0);

  participationStat = computed(() => {
    const members      = this.totalMembres();
    const all          = this.sondages();
    const sondageCount = all.length;
    const totalVotes   = all.reduce((sum, s) => sum + this.totalVotes(s), 0);
    if (!members || !sondageCount) {
      return { pct: 0, totalVotes, sondageCount, total: members };
    }
    // totalVotes / (sondageCount × members)
    const pct = Math.min(100, Math.round((totalVotes / (sondageCount * members)) * 100));
    return { pct, totalVotes, sondageCount, total: members };
  });

  participationDonut = computed(() => {
    const { pct } = this.participationStat();
    if (!pct) return '#e5e7eb';
    return `conic-gradient(#026654 0% ${pct}%, #e5e7eb ${pct}% 100%)`;
  });

  sondageStatusStat = computed(() => {
    const all = this.sondages();
    return [
      { label: 'En cours',  color: '#026654', count: all.filter(s => s.statut === 'OPEN').length },
      { label: 'Clôturés',  color: '#9ca3af', count: all.filter(s => s.statut === 'CLOSED').length },
      { label: 'Brouillons',color: '#f59e0b', count: all.filter(s => s.statut === 'DRAFT').length },
    ];
  });

  ngOnInit(): void {
    this.loadSondages();
    this.http.get<any>('/api/statistiques/bureau').subscribe({
      next: s => this.totalMembres.set(s.totalMembres ?? 0),
      error: () => {},
    });
  }

  loadSondages(): void {
    this.loading.set(true);
    this.sondageService.getActiveSondages().subscribe({
      next:  res => { this.sondages.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  goToCreate(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin' : '/bureau';
    this.router.navigate([`${base}/sondages/creer`]);
  }

  openDetail(s: Sondage): void  { this.selectedSondage.set(s); this.showDetail.set(true); }
  closeDetail(): void            { this.showDetail.set(false); this.selectedSondage.set(null); }

  publish(id: number): void {
    this.sondageService.publishSondage(id).subscribe({
      next:  () => { this.showToast('Sondage publié avec succès.', 'success'); this.closeDetail(); this.loadSondages(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de publier ce sondage.', 'error'),
    });
  }

  close(id: number): void {
    this.sondageService.closeSondage(id).subscribe({
      next:  () => { this.showToast('Sondage clôturé.', 'success'); this.closeDetail(); this.loadSondages(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de clôturer ce sondage.', 'error'),
    });
  }

  delete(id: number): void {
    this.sondageService.deleteSondage(id).subscribe({
      next:  () => { this.showToast('Sondage supprimé.', 'success'); this.closeDetail(); this.loadSondages(); },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de supprimer ce sondage.', 'error'),
    });
  }

  statusLabel(statut: string): string {
    const map: Record<string, string> = { DRAFT: 'Brouillon', OPEN: 'En cours', CLOSED: 'Clôturé', ARCHIVED: 'Archivé' };
    return map[statut] ?? statut;
  }

  optImageUrl(opt: import('../../core/models/sondage.model').SondageOption): string | null {
    return opt.imageBase64 && opt.imageType ? `data:${opt.imageType};base64,${opt.imageBase64}` : null;
  }

  totalVotes(s: Sondage): number {
    return s.options?.reduce((sum, o) => sum + (o.voteCount ?? 0), 0) ?? 0;
  }

  optionPercent(voteCount: number, total: number): number {
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }

  isWinner(s: Sondage, voteCount: number): boolean {
    if (s.statut !== 'CLOSED') return false;
    const max = Math.max(...(s.options?.map(o => o.voteCount ?? 0) ?? [0]));
    return max > 0 && voteCount === max;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
