import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  sondages        = signal<Sondage[]>([]);
  loading         = signal(true);
  toast           = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showDetail      = signal(false);
  selectedSondage = signal<Sondage | null>(null);

  ngOnInit(): void { this.loadSondages(); }

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
    return statut === 'DRAFT' ? 'Brouillon' : statut === 'ACTIVE' ? 'Actif' : 'Clôturé';
  }

  totalVotes(s: Sondage): number {
    return s.options?.reduce((sum, o) => sum + (o.voteCount ?? 0), 0) ?? 0;
  }

  optionPercent(voteCount: number, total: number): number {
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
