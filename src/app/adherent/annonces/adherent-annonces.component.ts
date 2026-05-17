import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SondageService } from '../../core/services/sondage.service';
import { ElectionCallService } from '../../core/services/election-call.service';
import { ElectionService } from '../../core/services/election.service';
import { Sondage, SondageOption } from '../../core/models/sondage.model';
import { Election, Candidate, positionLabel } from '../../core/models/election.model';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-adherent-annonces',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './adherent-annonces.component.html',
  styleUrl: './adherent-annonces.component.scss',
})
export class AdherentAnnoncesComponent implements OnInit {
  private sondageService      = inject(SondageService);
  private electionCallService = inject(ElectionCallService);
  private electionService     = inject(ElectionService);

  sondages         = signal<Sondage[]>([]);
  publishedElection = signal<Election | null>(null);
  loading          = signal(true);

  closedSondages = computed(() =>
    this.sondages()
      .filter(s => s.statut === 'CLOSED')
      .sort((a, b) => new Date(b.closedAt ?? b.updatedAt ?? '').getTime()
                    - new Date(a.closedAt ?? a.updatedAt ?? '').getTime())
  );

  hasContent = computed(() =>
    this.closedSondages().length > 0 || this.publishedElection() !== null
  );

  ngOnInit(): void {
    this.sondageService.getActiveSondages().subscribe({
      next: list => this.sondages.set(list),
      error: ()   => {},
    });

    this.electionCallService.getActiveCall().pipe(
      switchMap(call => {
        if (call?.publishedElectionId && call.publishedElectionStatus === 'RESULTS_PUBLISHED') {
          return this.electionService.getElectionById(call.publishedElectionId);
        }
        return of(null);
      })
    ).subscribe({
      next: election => { this.publishedElection.set(election); this.loading.set(false); },
      error: ()       => this.loading.set(false),
    });
  }

  // ── Sondage helpers ──────────────────────────────────────────────────────────
  totalVotes(s: Sondage): number {
    return s.options?.reduce((sum, o) => sum + (o.voteCount ?? 0), 0) ?? 0;
  }

  optionPercent(voteCount: number, total: number): number {
    return total === 0 ? 0 : Math.round((voteCount / total) * 100);
  }

  isWinner(opt: SondageOption, s: Sondage): boolean {
    const max = Math.max(...(s.options?.map(o => o.voteCount ?? 0) ?? [0]));
    return max > 0 && (opt.voteCount ?? 0) === max;
  }

  optionImageUrl(opt: SondageOption): string | null {
    return opt.imageBase64 && opt.imageType
      ? `data:${opt.imageType};base64,${opt.imageBase64}`
      : null;
  }

  // ── Election helpers ─────────────────────────────────────────────────────────
  positionLabel = positionLabel;

  electionPositions(e: Election): string[] {
    return Object.keys(e.candidatesByPosition ?? {});
  }

  candidatesForPosition(e: Election, pos: string): Candidate[] {
    return (e.candidatesByPosition as any)[pos] ?? [];
  }

  candidatePhoto(c: Candidate): string | null {
    return c.pictureUrl ?? null;
  }

  totalElectionVotes(e: Election): number {
    return e.totalVotes ?? 0;
  }

  candidatePct(c: Candidate, e: Election): number {
    const total = this.totalElectionVotes(e);
    return total === 0 ? 0 : Math.round((c.voteCount / total) * 100);
  }
}
