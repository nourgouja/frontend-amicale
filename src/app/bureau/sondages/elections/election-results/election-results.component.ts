import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { Election, Position, POSITIONS, positionLabel, positionLabel as posLabel } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-results.component.html',
  styleUrl: './election-results.component.scss',
})
export class ElectionResultsComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private electionService = inject(ElectionService);

  election    = signal<Election | null>(null);
  loading     = signal(true);
  closing     = signal(false);
  publishing  = signal(false);
  extraRound  = signal(false);
  toast       = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  positionLabel = positionLabel;
  positions     = POSITIONS;

  isAdmin = computed(() => this.router.url.startsWith('/admin'));

  positionGroups = computed(() => {
    const e = this.election();
    if (!e?.candidatesByPosition) return [];
    return this.positions
      .filter(p => e.candidatesByPosition[p.value]?.length > 0)
      .map(p => ({
        position: p.value,
        label: p.label,
        tied: e.tiedPositions?.includes(p.value) ?? false,
        candidates: e.candidatesByPosition[p.value] ?? [],
      }));
  });

  totalVotes = computed(() => {
    const e = this.election();
    if (!e) return 0;
    return e.candidates?.reduce((sum, c) => sum + c.voteCount, 0) ?? 0;
  });

  tiedLabels = computed(() => {
    const e = this.election();
    if (!e?.tiedPositions?.length) return '';
    return e.tiedPositions.map(p => posLabel(p)).join(', ');
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.electionService.getResults(id).subscribe({
      next:  e => { this.election.set(e); this.loading.set(false); },
      error: () => { this.loading.set(false); this.back(); },
    });
  }

  closeElection(): void {
    const id = this.election()?.id;
    if (!id || this.closing()) return;
    if (!confirm('Clôturer le vote ? Les membres ne pourront plus voter.')) return;
    this.closing.set(true);
    this.electionService.closeElection(id).subscribe({
      next: () => {
        // Reload via getResults to get tie detection in the response
        this.electionService.getResults(id).subscribe({
          next: e => { this.election.set(e); this.closing.set(false); this.showToast('Vote clôturé avec succès.', 'success'); },
          error: () => { this.closing.set(false); this.showToast('Vote clôturé, erreur de rechargement.', 'error'); },
        });
      },
      error: err => { this.closing.set(false); this.showToast(err?.error?.message ?? 'Erreur', 'error'); },
    });
  }

  publishResults(): void {
    const id = this.election()?.id;
    if (!id || this.publishing()) return;
    if (!confirm('Publier les résultats ? Les membres recevront une notification immédiatement.')) return;
    this.publishing.set(true);
    this.electionService.publishResults(id).subscribe({
      next: e => { this.election.set(e); this.publishing.set(false); this.showToast('Résultats publiés ! Les membres ont été notifiés.', 'success'); },
      error: err => { this.publishing.set(false); this.showToast(err?.error?.message ?? 'Erreur', 'error'); },
    });
  }

  createExtraRound(): void {
    const id = this.election()?.id;
    const tiedPositions = this.election()?.tiedPositions ?? [];
    if (!id || this.extraRound() || tiedPositions.length === 0) return;
    if (!confirm('Lancer un tour supplémentaire pour les postes à égalité ? Les membres recevront une notification.')) return;
    this.extraRound.set(true);
    const position = tiedPositions[0] as Position;
    this.electionService.createExtraRound(id, position).subscribe({
      next: newElection => {
        this.extraRound.set(false);
        this.showToast('Tour supplémentaire créé ! Les membres peuvent voter.', 'success');
        setTimeout(() => this.router.navigate(['/admin/elections', newElection.id, 'resultats']), 1800);
      },
      error: err => { this.extraRound.set(false); this.showToast(err?.error?.message ?? 'Erreur', 'error'); },
    });
  }

  goToExtraRound(): void {
    const id = this.election()?.extraRoundElectionId;
    if (id) this.router.navigate(['/admin/elections', id, 'resultats']);
  }

  back(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin'
               : this.router.url.startsWith('/bureau') ? '/bureau'
               : '/adherent';
    this.router.navigate([`${base}/elections`]);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
