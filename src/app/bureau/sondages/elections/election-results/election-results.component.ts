import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectionService } from '../../../../core/services/election.service';
import { Election, POSITIONS, positionLabel } from '../../../../core/models/election.model';

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

  election = signal<Election | null>(null);
  loading  = signal(true);

  positionLabel = positionLabel;
  positions     = POSITIONS;

  positionGroups = computed(() => {
    const e = this.election();
    if (!e?.candidatesByPosition) return [];
    return this.positions
      .filter(p => e.candidatesByPosition[p.value]?.length > 0)
      .map(p => ({
        position: p.value,
        label: p.label,
        candidates: e.candidatesByPosition[p.value] ?? [],
      }));
  });

  totalVotes = computed(() => {
    const e = this.election();
    if (!e) return 0;
    return e.candidates?.reduce((sum, c) => sum + c.voteCount, 0) ?? 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.electionService.getResults(id).subscribe({
      next:  e => { this.election.set(e); this.loading.set(false); },
      error: () => { this.loading.set(false); this.back(); },
    });
  }

  back(): void {
    const base = this.router.url.startsWith('/admin') ? '/admin'
               : this.router.url.startsWith('/bureau') ? '/bureau'
               : '/adherent';
    this.router.navigate([`${base}/elections`]);
  }
}
