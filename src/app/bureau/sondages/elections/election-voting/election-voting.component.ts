import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { Election, Position, POSITIONS, positionLabel } from '../../../../core/models/election.model';

@Component({
  selector: 'app-election-voting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './election-voting.component.html',
  styleUrl: './election-voting.component.scss',
})
export class ElectionVotingComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private electionService = inject(ElectionService);

  election        = signal<Election | null>(null);
  loading         = signal(true);
  voting          = signal<number | null>(null);
  toast           = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  activePosition  = signal<Position>('PRESIDENT');

  positionLabel = positionLabel;
  positions     = POSITIONS;

  positionGroups = computed(() => {
    const e = this.election();
    if (!e) return [];

    return this.positions.map(p => {
      const candidates = e.candidates?.filter(c => c.position === p.value) ?? [];
      return {
        position: p.value as Position,
        label: p.label,
        candidates,
        hasVoted: e.votedPositions?.includes(p.value as Position) ?? false,
        votedFor: e.candidates?.find(
          c => c.position === p.value && e.votedPositions?.includes(p.value as Position)
        ) ?? null,
      };
    }).filter(g => g.candidates.length > 0);
  });

  isResultMode = computed(() => this.election()?.status === 'CLOSED');

  activeGroup = computed(() =>
    this.positionGroups().find(g => g.position === this.activePosition()) ?? null
  );

  votedCount = computed(() => this.positionGroups().filter(g => g.hasVoted).length);

  setActivePosition(p: Position): void { this.activePosition.set(p); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.electionService.getElectionById(id).subscribe({
      next: e => {
        if (e.status === 'CLOSED') {
          this.electionService.getResults(id).subscribe({
            next: r => { this.election.set(r); this.loading.set(false); },
            error: () => { this.election.set(e); this.loading.set(false); },
          });
        } else {
          this.election.set(e);
          const firstUnvoted = this.positions.find(
            p => e.candidates?.some(c => c.position === p.value) && !e.votedPositions?.includes(p.value)
          ) ?? this.positions.find(p => e.candidates?.some(c => c.position === p.value));
          if (firstUnvoted) this.activePosition.set(firstUnvoted.value);
          this.loading.set(false);
        }
      },
      error: () => { this.loading.set(false); this.router.navigate(['/adherent/elections']); },
    });
  }

  vote(electionId: number, candidateId: number): void {
    if (this.voting() !== null) return;
    this.voting.set(candidateId);

    this.electionService.vote(electionId, candidateId).subscribe({
      next: updated => {
        this.election.set(updated);
        this.voting.set(null);
        this.showToast('Vote enregistré avec succès !', 'success');
      },
      error: err => {
        this.voting.set(null);
        this.showToast(err?.error?.message ?? 'Impossible de voter.', 'error');
      },
    });
  }

  hasVotedForPosition(position: Position): boolean {
    return this.election()?.votedPositions?.includes(position) ?? false;
  }

  back(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin'
               : this.router.url.startsWith('/bureau') ? '/bureau'
               : '/adherent';
    this.router.navigate([`${base}/elections`]);
  }

  allPositionsVoted(): boolean {
    const groups = this.positionGroups();
    return groups.every(g => g.hasVoted);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
