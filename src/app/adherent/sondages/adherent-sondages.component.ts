import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SondageService } from '../../core/services/sondage.service';
import { Sondage } from '../../core/models/sondage.model';

@Component({
  selector: 'app-adherent-sondages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adherent-sondages.component.html',
  styleUrl: './adherent-sondages.component.scss',
})
export class AdherentSondagesComponent implements OnInit {
  private sondageService = inject(SondageService);

  sondages  = signal<Sondage[]>([]);
  loading   = signal(true);
  toast     = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  activeTab = signal<'active' | 'closed'>('active');

  activeSondages = computed(() => this.sondages().filter(s => s.statut === 'ACTIVE'));
  closedSondages = computed(() => this.sondages().filter(s => s.statut === 'CLOSED'));

  currentList = computed(() =>
    this.activeTab() === 'active' ? this.activeSondages() : this.closedSondages()
  );

  ngOnInit(): void {
    this.sondageService.getActiveSondages().subscribe({
      next:  res => { this.sondages.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  hasVoted(sondageId: number): boolean {
    return localStorage.getItem(`sondage_voted_${sondageId}`) !== null;
  }

  votedOptionId(sondageId: number): number | null {
    const v = localStorage.getItem(`sondage_voted_${sondageId}`);
    return v !== null ? +v : null;
  }

  vote(sondageId: number, optionId: number): void {
    if (this.hasVoted(sondageId)) return;
    this.sondageService.vote(sondageId, optionId).subscribe({
      next: () => {
        localStorage.setItem(`sondage_voted_${sondageId}`, String(optionId));
        this.sondageService.getSondageById(sondageId).subscribe({
          next: updated => this.sondages.update(list => list.map(s => s.id === sondageId ? updated : s)),
        });
        this.showToast('Vote enregistré avec succès !', 'success');
      },
      error: err => this.showToast(err?.error?.message ?? 'Impossible de voter.', 'error'),
    });
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
